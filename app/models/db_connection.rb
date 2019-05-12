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

  def password(key)
    decipher = OpenSSL::Cipher::AES256.new :CBC
    decipher.decrypt
    decipher.iv = Base64.strict_decode64(initialization_vector)
    decipher.key = Base64.strict_decode64(key)
    decipher.update(Base64.strict_decode64(password_encrypted)) + decipher.final
  end

  # @param key [String] encryption key
  # @param password [String] password to encrypt
  # @return [Hash<symbol, string>] hash with encrypted password
  #   including salt and initialization_vector:
  #   e.g.
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

  def db_adapter
    case db_type.to_sym
    when :psql
      'postgresql'
    when :mysql
      'mysql2'
    end
  end

  def default_database
    case db_type.to_sym
    when :psql
      'postgres'
    when :mysql
      'mysql'
    end
  end

  def connect(key:, database:)
    original_connection = ActiveRecord::Base.remove_connection
    ActiveRecord::Base.establish_connection(
      adapter: db_adapter,
      host: host,
      port: port,
      username: username,
      password: password(key),
      database: database || initial_db || default_database
    )
    yield
  ensure
    ActiveRecord::Base.establish_connection(original_connection)
  end

  def exec_query(key:, database: nil)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.exec_query(yield)
    end
  end

  def databases(key:)  
    exec_query(key: key) do
      query_for(db_type: db_type, name: :databases)
    end&.rows&.flatten
  end

  def tables(key:, database:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.tables
    end
  end

  def columns(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.columns(table)
    end.map(&:name)
  end

  def primary_keys(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.primary_keys(table)
    end
  end

  def foreign_keys(key:, database:, table:)
    # seems to return only empty array!?
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.foreign_keys(table)
    end
  end

  def indexes(key:, database:, table:)
    connect(key: key, database: database) do
      ActiveRecord::Base.connection.indexes(table)
    end
  end

end
