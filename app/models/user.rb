# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                          :uuid             not null, primary key
#  activated_at                :datetime
#  activation_digest           :string
#  email                       :string
#  login_count                 :integer          default(0)
#  password_digest             :string
#  private_key_pem             :string
#  public_key_pem              :string
#  reset_password_digest       :string
#  reset_password_mail_sent_at :datetime
#  role                        :integer          default("user")
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#
# Indexes
#
#  index_users_on_email  (email) UNIQUE
#

class User < ApplicationRecord
  has_many :user_groups
  has_many :groups, through: :user_groups
  has_secure_password
  has_many :database_schema_queries,
           class_name: 'DatabaseSchemaQuery',
           foreign_key: :author_id
  before_create :create_activation_digest
  after_create  :create_key_pairs
  before_save   :downcase_email

  ROLES = %i[user admin].freeze

  enum role: ROLES

  has_many :login_tokens, dependent: :destroy
  has_many :db_servers, dependent: :destroy

  ACTIVATION_PERIOD = 7.days
  PASSWORD_RESET_PERIOD = 1.day

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

  def has_keypair?
    !!private_key_pem && !!public_key_pem
  end

  def login(password)
    return unless authenticate password

    # TODO: remove once all users have a keypair
    update_key_pairs!(crypto_key: crypto_key(password)) unless has_keypair?

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

  def query_count
    db_servers.map { |db_server| db_server.query_count }.sum
  end

  def error_query_count
    db_servers.map { |db_server| db_server.error_query_count }.sum
  end

  def activated?
    !activated_at.nil?
  end

  def change_password!(
    old_password:,
    new_password:,
    password_confirmation:
  )
    ActiveRecord::Base.transaction do
      update!(
        password: new_password,
        password_confirmation: password_confirmation,
        reset_password_digest: nil,
        reset_password_mail_sent_at: nil
      )
      db_servers.each do |db_server|
        db_server.recrypt!(
          old_crypto_key: crypto_key(old_password),
          new_crypto_key: crypto_key(new_password)
        )
      end
      update_key_pairs!(
        crypto_key: crypto_key(new_password),
        old_crypto_key: crypto_key(old_password)
      )
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
      update_key_pairs!(crypto_key: crypto_key(password))
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
    !activated? && DateTime.now >= created_at + ACTIVATION_PERIOD
  end

  # @return [boolean] returns if a password reset was requested.
  #   however it does not check if the request is expired
  def password_reset_requested?
    !!(reset_password_digest && reset_password_mail_sent_at)
  end

  def pending_password_reset_request?
    return false unless password_reset_requested?

    DateTime.now < reset_password_mail_sent_at + PASSWORD_RESET_PERIOD
  end

  def public_key
    return unless has_keypair?

    OpenSSL::PKey::RSA.new(public_key_pem)
  end

  # @param crypto_key [String] the users secret crypto key
  def private_key(crypto_key)
    return unless has_keypair?

    OpenSSL::PKey::RSA.new(private_key_pem, crypto_key)
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

  def create_key_pairs
    return unless password

    update_key_pairs!(crypto_key: crypto_key(password))
  end

  def create_reset_password_digest
    self.reset_password_token = SecureRandom.urlsafe_base64
    self.reset_password_mail_sent_at = DateTime.now
    self.reset_password_digest = BCrypt::Password.create(
      @reset_password_token,
      cost: BCrypt::Engine.cost
    )
  end

  def update_key_pairs!(crypto_key:, old_crypto_key: nil)
    rsa_key = OpenSSL::PKey::RSA.new(2048)
    cipher =  OpenSSL::Cipher.new('des3')
    ActiveRecord::Base.transaction do
      if has_keypair?
        if old_crypto_key.nil?
          user_groups.update_all(
            is_outdated: true
          )
        else
          pkey = private_key(old_crypto_key)

          user_groups.each do |user_group|
            secret = user_group.secret(pkey)
            user_group.update!(
              crypto_key_encrypted: rsa_key.public_key.public_encrypt(secret)
            )
          end
        end
      end

      update!(
        private_key_pem: rsa_key.to_pem(cipher, crypto_key),
        public_key_pem: rsa_key.public_key.to_pem
      )
    end
  end
end
