class User < ApplicationRecord
  has_secure_password

  has_many :login_tokens, dependent: :destroy

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
end
