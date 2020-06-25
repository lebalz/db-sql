# frozen_string_literal: true

# == Schema Information
#
# Table name: group_members
#
#  crypto_key_encrypted :string
#  is_admin             :boolean          default(FALSE), not null
#  is_outdated          :boolean          default(FALSE), not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  group_id             :uuid             not null, primary key
#  user_id              :uuid             not null, primary key
#
# Indexes
#
#  index_group_members_on_group_id  (group_id)
#  index_group_members_on_user_id   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (group_id => groups.id)
#  fk_rails_...  (user_id => users.id)
#
class GroupMember < ApplicationRecord
  self.table_name = 'group_members'
  self.primary_keys = [ :user_id, :group_id ]

  belongs_to :user
  belongs_to :group

  def admin?
    is_admin
  end

  def outdated?
    is_outdated
  end

  # @param private_key [OpenSSL::PKey::RSA]
  # @return [string] decrypted, Base64 encoded, crypto key
  def crypto_key(private_key)
    private_key.private_decrypt(Base64.strict_decode64(crypto_key_encrypted))
  rescue StandardError
    nil
  end
end
