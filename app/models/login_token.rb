# frozen_string_literal: true

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