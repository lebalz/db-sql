# frozen_string_literal: true

# == Schema Information
#
# Table name: users_groups
#
#  crypto_key_encrypted :string           not null
#  is_admin             :boolean          default(FALSE), not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  group_id             :uuid             not null
#  user_id              :uuid             not null
#
# Indexes
#
#  index_users_groups_on_group_id  (group_id)
#  index_users_groups_on_user_id   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (group_id => groups.id)
#  fk_rails_...  (user_id => users.id)
#
class UserGroup < ApplicationRecord
  self.table_name = 'users_groups'

  belongs_to :user
  belongs_to :group

  def admin?
    is_admin
  end

  def crypto_key(private_key)
    private_key.private_decrypt(crypto_key_encrypted)
  end
end
