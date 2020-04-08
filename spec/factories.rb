# frozen_string_literal: true

FactoryBot.define do

  factory :login_token do
    token { '1' }
    association :user, factory: :user
  end

  factory :user do
    sequence(:email) { |n| "sqler#{n}@db.ch" }
    password { 'asdfasdf' }
    activated { true }
    activated_at { DateTime.now }
    trait :admin do
      sequence(:email) { |n| "admin#{n}@db.ch" }
      role { 'admin' }
    end
  end

  factory :db_server do
    transient do
      user_password { 'asdfasdf' }
      db_password { 'safe-db-password' }
      crypt do
        DbServer.encrypt(
          key: user.crypto_key(user_password),
          db_password: db_password
        )
      end
    end
    sequence(:name) { |n| "db_server#{n}" }
    db_type { 0 }
    host { 'localhost' }
    port { DbServer::DEFAULT_PORT_PSQL }
    username { 'foo' }
    initialization_vector { crypt[:initialization_vector] }
    password_encrypted { crypt[:encrypted_password] }
    association :user, factory: :user
  end
end
