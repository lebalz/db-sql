class DbConnection < ApplicationRecord
  enum db_type: [:psql, :mysql, :mariadb, :sqlite]
  belongs_to :user

  def password(key)
    decipher = OpenSSL::Cipher::AES256.new :CBC
    decipher.decrypt
    decipher.iv = Base64.strict_decode64(iv)
    decipher.key = Base64.strict_decode64(key)
    decipher.update(Base64.strict_decode64(password_encrypted)) + decipher.final
  end

end
