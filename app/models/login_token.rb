# frozen_string_literal: true

# == Schema Information
#
# Table name: login_tokens
#
#  id         :uuid             not null, primary key
#  token      :string
#  user_id    :uuid             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
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
