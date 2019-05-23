# frozen_string_literal: true

class SeedUsers
  def self.perform
    User.create!(
      email: 'test@user.ch',
      password: 'asdfasdf',
      password_confirmation: 'asdfasdf'
    )
  end
end