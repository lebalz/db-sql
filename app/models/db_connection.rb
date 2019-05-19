require "#{Rails.root}/lib/queries/query"
# == Schema Information
#
# Table name: db_connections
#
#  id                    :uuid             not null, primary key
#  user_id               :uuid
#  name                  :string
#  db_type               :integer
#  host                  :string
#  port                  :integer
#  password_encrypted    :string
#  initialization_vector :string
#  initial_db            :string
#  initial_schema        :string
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  username              :string
#

class DbConnection < ApplicationRecord
  enum db_type: [:psql, :mysql, :mariadb, :sqlite]
  DEFAULT_PORT_PSQL = 5432
  DEFAULT_PORT_MYSQL = 3306
  DEFAULT_PORT_MARIADB = 3306

  belongs_to :user

  # @param key [String] base64 encoded crypto key from the user
  # @return [String] cleartext password for the db connection
  def password(key)
    decipher = OpenSSL::Cipher::AES256.new :CBC
    decipher.decrypt
    decipher.iv = Base64.strict_decode64(initialization_vector)
    decipher.key = Base64.strict_decode64(key)
    decipher.update(Base64.strict_decode64(password_encrypted)) + decipher.final
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param password [String] password for db server connection to encrypt
  # @option iv [string]
  # @return [Hash<symbol, string>] hash with encrypted password
  #   including salt and initialization_vector:
  # @example encrypted password
  #   {
  #     encrypted_password: <Base64 encoded encrypted string>,
  #     initialization_vector: <Base64 enctoded string>,
  #     key: string
  #   }
  def self.encrypt(key:, password:, iv: nil)
    error!('No AES key sent', 401) unless key

    aes_key = Base64.strict_decode64(key)
    cipher = OpenSSL::Cipher::AES.new(256, :CBC)
    iv = iv ? Base64.strict_decode64(iv) : cipher.random_iv
    cipher.iv = iv
    cipher.encrypt
    cipher.key = aes_key
    pw_encrypted = cipher.update(password) + cipher.final
    {
      encrypted_password: Base64.strict_encode64(pw_encrypted),
      initialization_vector: Base64.strict_encode64(iv),
      key: key
    }
  end

  # @return [String, nil] default db adapter for AR 
  def db_adapter
    case db_type.to_sym
    when :psql
      'postgresql'
    when :mysql
      'mysql2'
    end
  end

  # @return [String, nil] default schema which should be present in a
  #   for the selected db 
  def default_schema
    case db_type.to_sym
    when :psql
      'postgres'
    when :mysql
      'mysql'
    end
  end

  # @return [String] unique key for a db connection
  private def connection_key(database_name:)
    database_name ||= initial_db || default_schema
    "#{id}-#{database_name}"
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  def connect(key:, database_name:)
    database_name ||= initial_db || default_schema
    connection = ActiveRecord::ConnectionAdapters::ConnectionHandler.new
    conn_key = connection_key(database_name: database_name)
    connection.establish_connection(
      adapter: db_adapter,
      host: host,
      port: port,
      username: username,
      password: password(key),
      database: database_name,
      name: conn_key
    )
    yield(connection.retrieve_connection(conn_key))
  ensure
    connection.remove_connection(conn_key)
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [ActiveRecord::Result]
  def exec_query(key:, database_name: nil)
    connect(key: key, database_name: database_name) do |connection|
      connection.exec_query(yield)
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [Array<String>] all database_name names for a connection
  def database_names(key:)  
    exec_query(key: key) do
      query_for(db_type: db_type, name: :databases)
    end&.rows&.flatten&.sort || []
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @return [Array<String>] all table_name names in the database_name
  def table_names(key:, database_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.tables.sort
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<String>] columns of a table_name
  def column_names(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      c = connection.columns(table_name)
    end.map(&:name)
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<Hash>] columns of a table_name
  # @example columns of a table
  #   [
  #     {
  #       name: 'id',
  #       collation: nil,
  #       default: nil,
  #       default_function: "nextval('ninja_turtles_id_seq'::regclass)",
  #       null: false,
  #       serial: true,
  #       sql_type_metadata: {
  #         limit: 4,
  #         precision: nil,
  #         scale: nil,
  #         sql_type: 'integer',
  #         type: :integer
  #       }
  #     }
  #   ]
  def columns(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      c = connection.columns(table_name).map do |column|
        {
          name: column.name,
          collation: column.collation,
          default: column.default,
          default_function: column.default_function,
          null: column.null,
          serial: column.serial?,
          sql_type_metadata: {
            limit: column.sql_type_metadata.limit,
            precision: column.sql_type_metadata.precision,
            scale: column.sql_type_metadata.scale,
            sql_type: column.sql_type_metadata.sql_type,
            type: column.sql_type_metadata.type
          }
        }
      end
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<String>] primary keys of a table_name
  def primary_key_names(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.primary_keys(table_name).sort
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<Hash>] foreign keys of the table_name
  # @example foreign keys of a table_name
  #   [
  #     {
  #       from_table: "tore",
  #       to_table: "spiele",
  #       options: {
  #         column: "spiel_id",
  #         name: "tore_ibfk_1",
  #         primary_key: "id",
  #         on_update: nil,
  #         on_delete: nil
  #       }
  #     },
  #     {
  #       from_table: "tore",
  #       to_table: "spieler",
  #       options: {
  #         column: "spieler_id",
  #         name: "tore_ibfk_2",
  #         primary_key: "id",
  #         on_update: nil,
  #         on_delete: nil
  #       }
  #     }
  #   ]
  def foreign_keys(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.foreign_keys(table_name).map { |fk_def| fk_def.to_h }
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<Hash>] indexs of a table_name
  # @example indexes of a table_name
  #   [
  #     {
  #       table_name: "teams",
  #       name: "id",
  #       unique: true,
  #       columns: ["id"],
  #       lengths: {},
  #       orders: {},
  #       opclasses: {},
  #       where: nil,
  #       type: nil,
  #       using: :btree,
  #       comment: nil
  #     }
  #   ]
  def indexes(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.indexes(table_name).map do |index_def|
        index_def.instance_values.symbolize_keys
      end
    end
  end

end
