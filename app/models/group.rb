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
  has_many :user_groups, dependent: :destroy
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

  # @param user [User]
  # @return [Group::ActiveRecord_Relation]
  def self.available(user)
    escaped_id = ActiveRecord::Base.connection.quote(user.id)
    Group
      .left_outer_joins(:user_groups)
      .where(is_private: false)
      .or(
        Group
          .left_outer_joins(:user_groups)
          .where("users_groups.user_id = ?", u.id)
      )
      .order(
        Arel.sql("users_groups.user_id=#{escaped_id} DESC, updated_at DESC")
      )
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
    user_groups.pluck(:user_id)
  end

  # when a user of this group had to reset it's password,
  # the crypto key could not be updated correctly and the UserGroup
  # is marked as outdated.
  # @return [boolean]
  def has_outdated_members?
    user_groups.any?(&:outdated?)
  end

  def outdated_user_groups
    user_groups.where(is_outdated: true)
  end

  def admins
    user_groups.where(is_admin: true)
  end

  # @param user [User]
  # @return [boolean]
  def admin?(user)
    admins.include?(user)
  end

  # @param group_key [String] key used to decrypt the
  #   db server passwords of this group
  def update_outdated_members(group_key:)
    outdated_user_groups.each do |user_group|
      key = Base64.strict_encode64(
        user_group.user.public_key.public_encrypt(group_key)
      )
      user_group.update!(
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
      user_groups.each do |user_group|
        key = Base64.strict_encode64(
          user_group.user.public_key.public_encrypt(new_key)
        )
        user_group.update!(
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
