# frozen_string_literal: true

class SeedUsers
  def self.perform
    User.create!(
      email: 'test@user.ch',
      password: 'asdfasdf',
      password_confirmation: 'asdfasdf',
      role: 'admin',
      activated_at: DateTime.now - 2.days
    )
    User.create!(
      email: 'admin@user.ch',
      password: 'asdfasdf',
      password_confirmation: 'asdfasdf',
      role: 'admin',
      activated_at: DateTime.now
    )
  end
end
