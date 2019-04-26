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
  enum default_port: { psql: 5432, mysql: 3306, mariadb: 3306 }
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

end
