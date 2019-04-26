# frozen_string_literal: true

FactoryBot.define do

  factory :login_token do
    token { '1' }
    association :user, factory: :user
  end

  factory :user do
    sequence(:email) { |n| "sqler#{n}@db.ch" }
    password { 'asdfasdf' }
  end

  factory :db_connection do
    sequence(:name) { |n| "connection#{n}" }
    db_type { 0 }
    host { 'localhost' }
    port { DbConnection::DEFAULT_PORT_PSQL }
    initialization_vector do
      DbConnection.encrypt(
        key: user.crypto_key('asdfasdf'),
        password: 'safe-db-password'
      )[:initialization_vector]
    end
    password_encrypted do
      DbConnection.encrypt(
        key: user.crypto_key('asdfasdf'),
        password: 'safe-db-password'
      )[:encrypted_password]
    end
    association :user, factory: :user
  end
end