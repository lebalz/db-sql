# frozen_string_literal: true

# == Schema Information
#
# Table name: login_tokens
#
#  id         :uuid             not null, primary key
#  token      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :uuid             not null
#
# Indexes
#
#  index_login_tokens_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#

class LoginToken < ApplicationRecord
  belongs_to :user

  before_create :generate_token

  TOKEN_VALID_DURATION = 14.days

  def expired?
    DateTime.now >= created_at + TOKEN_VALID_DURATION
  end

  private

  def generate_token
    self.token = SecureRandom.hex(32)
  end
end
