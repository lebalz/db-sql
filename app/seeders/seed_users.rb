# frozen_string_literal: true

class SeedUsers
  def self.perform
    User.create!(
      email: 'test@user.ch',
      password: 'asdfasdf',
      password_confirmation: 'asdfasdf'
    )
    User.create!(
      email: 'admin@user.ch',
      password: 'asdfasdf',
      password_confirmation: 'asdfasdf',
      role: 'admin'
    )
  end
end