# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                :uuid             not null, primary key
#  email             :string
#  password_digest   :string
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  login_count       :integer          default(0)
#  role              :integer          default("user")
#  activation_digest :string
#  activated         :boolean          default(FALSE)
#  activated_at      :datetime
#

class User < ApplicationRecord
  has_secure_password
  before_create :create_activation_digest
  before_save   :downcase_email

  ROLES = %i[user admin].freeze

  enum role: ROLES

  has_many :login_tokens, dependent: :destroy
  has_many :db_servers, dependent: :destroy

  validates(
    :email,
    presence: true,
    uniqueness: true,
    format: { with: URI::MailTo::EMAIL_REGEXP }
  )
  validates(
    :password,
    length: { minimum: 8, maximum: 72 },
    if: -> { password.present? }
  )

  attr_accessor :activation_token, :reset_password_token

  def login(password)
    return unless authenticate password

    token = LoginToken.new
    login_tokens << token
    self.login_count += 1
    save!
    token.token
  end

  def logout(token)
    t = LoginToken.find_by(token: token)
    t.destroy
    save
  end

  def change_password!(
    old_password:,
    new_password:,
    password_confirmation:
  )
    ActiveRecord::Base.transaction do
      update!(
        password: new_password,
        password_confirmation: password_confirmation
      )
      db_servers.each do |db_server|
        db_server.recrypt!(
          old_crypto_key: crypto_key(old_password),
          new_crypto_key: crypto_key(new_password)
        )
      end
      login_tokens.destroy_all
    end
  end

  # !! all db server passwords will be useless
  # because we can not decrypt them. They are blanked out
  def reset_password(reset_token:, password:, password_confirmation:)
    return unless password_reset_authenticated?(token: reset_token)

    ActiveRecord::Base.transaction do
      update!(
        password: password,
        password_confirmation: password_confirmation,
        reset_password_digest: nil,
        reset_password_mail_sent_at: nil
      )
      db_servers.each do |db_server|
        db_server.reset_crypto_key(
          new_crypto_key: crypto_key(password)
        )
      end
      login_tokens.destroy_all
    end
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

  def activate(token)
    valid = BCrypt::Password.new(activation_digest)
                            .is_password?(token)

    return false unless valid

    update!(
      activated: true,
      activated_at: Time.zone.now
    )
  end

  # resets the activation digest. This is used when
  # the activation link is resend
  def reset_activation_digest
    return if activated?

    create_activation_digest
    save!
    self
  end

  def request_password_reset
    create_reset_password_digest
    save!
    self
  end

  def activation_expired?
    !activated? && DateTime.now >= created_at + 2.days
  end

  # @return [boolean] returns if a password reset was requested.
  #   however it does not check if the request is expired
  def password_reset_requested?
    !!(reset_password_digest && reset_password_mail_sent_at)
  end

  def pending_password_reset_request?
    return false unless password_reset_requested?

    DateTime.now < reset_password_mail_sent_at + 12.hours
  end

  private

  def password_reset_authenticated?(token:)
    unless password_reset_requested?
      errors.add(:base, 'No password reset requested')
      return false
    end
    unless pending_password_reset_request?
      errors.add(:base, 'The reset link is outdated, request a new one.')
      return false
    end
    valid = BCrypt::Password.new(reset_password_digest)
                            .is_password?(token)

    unless valid
      errors.add(:base, 'Invalid reset token')
      return false
    end
    true
  end

  # Converts email to all lower-case.
  def downcase_email
    self.email = email.downcase
  end

  def create_activation_digest
    self.activation_token  = SecureRandom.urlsafe_base64

    self.activation_digest = BCrypt::Password.create(
      @activation_token,
      cost: BCrypt::Engine.cost
    )
  end

  def create_reset_password_digest
    self.reset_password_token = SecureRandom.urlsafe_base64
    self.reset_password_mail_sent_at = DateTime.now
    self.reset_password_digest = BCrypt::Password.create(
      @reset_password_token,
      cost: BCrypt::Engine.cost
    )
  end
end
