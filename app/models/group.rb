# frozen_string_literal: true

# == Schema Information
#
# Table name: groups
#
#  id         :uuid             not null, primary key
#  is_private :boolean          default(TRUE), not null
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Group < ApplicationRecord
  has_many :user_groups
  has_many :users, through: :user_groups

  has_many :db_servers, dependent: :destroy

  def self.random_crypto_key
    hash = OpenSSL::Digest::SHA256.new
    key = OpenSSL::KDF.pbkdf2_hmac(
      OpenSSL::Digest::SHA256.new.to_s,
      salt: Time.now.to_i.to_s,
      iterations: 20_000,
      length: hash.length,
      hash: hash
    )
    Base64.strict_encode64(key)
  end

  def private?
    is_private
  end

  # @return [Array<UUID>]
  def user_ids
    user_groups.pluck(:user_id)
  end

  # @param user [User]
  # @param group_key [String] key used to decrypt the
  #   db server passwords of this group
  # @param is_admin [boolean]
  def add_user(user:, group_key:, is_admin: false)
    return if user_ids.include? user.id

    key = Base64.strict_encode64(user.public_key.public_encrypt(group_key))
    UserGroup.create!(
      crypto_key_encrypted: key,
      group: self,
      user: user,
      is_admin: is_admin
    )
  end

  # @param user [User]
  # @return [String] key used to decrypt the
  #   db server passwords of this group
  # @param private_key [OpenSSL::PKey::RSA]
  def crypto_key(user, private_key)
    rel = user_groups.find_by(user: user)
    return unless rel

    rel.crypto_key(private_key)
  end

  # @return [Integer]
  def user_count
    user_groups.size
  end

  # @return [Integer]
  def db_server_count
    db_servers.size
  end

  # @param user [User]
  def remove_user(user:)
    user_groups.find_by(user_id: user.id)&.destroy
    reload!
    return unless user_count.zero?

    destroy!
  end
end
