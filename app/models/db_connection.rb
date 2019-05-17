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
  # @return [Hash<symbol, string>] hash with encrypted password
  #   including salt and initialization_vector:
  # @example encrypted password
  #   {
  #     encrypted_password: <Base64 encoded encrypted string>,
  #     initialization_vector: <Base64 enctoded string>,
  #     key: string
  #   }
  def self.encrypt(key:, password:)
    error!('No AES key sent', 401) unless key

    aes_key = Base64.strict_decode64(key)
    cipher = OpenSSL::Cipher::AES.new(256, :CBC)
    iv = cipher.random_iv
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

  # @param key [String] base64 encoded crypto key from the user
  # @param database [String] name of the database
  def connect(key:, database:)
    original_connection = ActiveRecord::Base.remove_connection
    ActiveRecord::Base.establish_connection(
      adapter: db_adapter,
      host: host,
      port: port,
      username: username,
      password: password(key),
      database: database || initial_db || default_schema
    )
    yield
  ensure
    ActiveRecord::Base.establish_connection(original_connection)
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [ActiveRecord::Result]
  def exec_query(key:, database: nil)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.exec_query(yield)
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [Array<String>] all databases for a connection
  def databases(key:)  
    exec_query(key: key) do
      query_for(db_type: db_type, name: :databases)
    end&.rows&.flatten
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database [String] name of the database
  # @return [Array<String>] all tables in the database
  def tables(key:, database:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.tables
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database [String] name of the database
  # @param table [String] name of the table
  # @return [Array<String>] columns of a table
  def columns(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.columns(table)
    end.map(&:name)
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database [String] name of the database
  # @param table [String] name of the table
  # @return [Array<String>] primary keys of a table
  def primary_keys(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.primary_keys(table)
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database [String] name of the database
  # @param table [String] name of the table
  # @return [Array<Hash>] foreign keys of the table
  # @example foreign keys of a table
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
  def foreign_keys(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.foreign_keys(table).map { |fk_def| fk_def.to_h }
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database [String] name of the database
  # @param table [String] name of the table
  # @return [Array<Hash>] indexs of a table
  # @example indexes of a table
  #   [
  #     {
  #       table: "teams",
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
  def indexes(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.indexes(table).map do |index_def|
        index_def.instance_values.symbolize_keys
      end
    end
  end

end
