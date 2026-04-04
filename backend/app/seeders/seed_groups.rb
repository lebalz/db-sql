# frozen_string_literal: true

class SeedGroups
  def self.perform
    g = Group.create!(
      name: 'Sharing is caring',
      is_private: true
    )
    key = Group.random_crypto_key
    User.all.each do |user|
      g.add_user(
        user: user,
        group_key: key,
        is_admin: true
      )
    end
  end
end
