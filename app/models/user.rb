# == Schema Information
#
# Table name: users
#
#  id              :uuid             not null, primary key
#  email           :string
#  password_digest :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

class User < ApplicationRecord
  has_secure_password

  has_many :login_tokens, dependent: :destroy
  has_many :db_connections, dependent: :destroy

  validates :email, presence: true, uniqueness: true

  def login(password)
    return unless authenticate password

    token = LoginToken.new
    login_tokens << token
    save
    token.token
  end

  def logout(token)
    t = LoginToken.find_by(token: token)
    t.destroy
    save
  end

  # generate a key to encrypt db passwords client side
  # @param password [String] clear text password. (Not stored to db)
  # @return [String] base64 encoded key
  def crypto_key(password)
    hash = OpenSSL::Digest::SHA256.new
    key = OpenSSL::KDF.pbkdf2_hmac(
      password,
      salt: id,
      iterations: 20_000,
      length: hash.length,
      hash: hash
    )
    Base64.strict_encode64(key)
  end
end
