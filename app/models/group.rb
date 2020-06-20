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
  has_many :group_members, dependent: :delete_all
  alias members group_members
  has_many :users, through: :group_members

  has_many :db_servers, dependent: :delete_all

  scope :public_available, -> { where(is_private: false) }

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

  def public?
    !private?
  end

  # @param user [User]
  def member?(user)
    users.include?(user)
  end

  # @return [Array<UUID>]
  def user_ids
    group_members.pluck(:user_id)
  end

  # when a user of this group had to reset it's password,
  # the crypto key could not be updated correctly and the GroupMember
  # is marked as outdated.
  # @return [boolean]
  def has_outdated_members?
    group_members.any?(&:outdated?)
  end

  def outdated_members
    group_members.where(is_outdated: true)
  end

  def admins
    group_members.where(is_admin: true).map(&:user)
  end

  # @param user [User]
  # @return [boolean]
  def admin?(user)
    admins.include?(user)
  end

  # @param group_key [String] key used to decrypt the
  #   db server passwords of this group
  def update_outdated_members(group_key:)
    outdated_members.each do |member|
      key = Base64.strict_encode64(
        member.user.public_key.public_encrypt(group_key)
      )
      member.update!(
        crypto_key_encrypted: key,
        is_outdated: false
      )
    end
  end

  # !! all db server passwords will be useless!!
  # A new crypto key is set without migrating the passwords of the
  # related db servers.
  def force_new_crypto_key!
    ActiveRecord::Base.transaction do
      new_key = Group.random_crypto_key
      group_members.each do |member|
        key = Base64.strict_encode64(
          member.user.public_key.public_encrypt(new_key)
        )
        member.update!(
          crypto_key_encrypted: key,
          is_outdated: false
        )
      end
      db_servers.each do |db_server|
        db_server.reset_crypto_key(
          new_crypto_key: new_key
        )
      end
    end
  end

  # @param user [User]
  # @param group_key [String] key used to decrypt the
  #   db server passwords of this group
  # @param is_admin [boolean]
  def add_user(user:, group_key:, is_admin: false)
    return if user_ids.include? user.id

    key = Base64.strict_encode64(user.public_key.public_encrypt(group_key))
    GroupMember.create!(
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
    rel = group_members.find_by(user: user)
    return unless rel

    rel.crypto_key(private_key)
  end

  # @return [Integer]
  def user_count
    group_members.size
  end

  # @return [Integer]
  def db_server_count
    db_servers.size
  end

  # @param user [User]
  def remove_user(user:)
    group_members.find_by(user_id: user.id)&.destroy
    reload!
    return unless user_count.zero?

    destroy!
  end
end
