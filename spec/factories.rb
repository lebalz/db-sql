# frozen_string_literal: true

FactoryBot.define do

  factory :login_token do
    token { '1' }
    association :user, factory: :user
  end

  factory :user do
    sequence(:email) { |n| "sqler#{n}@db.ch" }
    password { 'asdfasdf' }
    activated_at { DateTime.now }
    trait :admin do
      sequence(:email) { |n| "admin#{n}@db.ch" }
      role { 'admin' }
    end
    trait :unactivated do
      activated_at { nil }
    end
  end

  factory :database_schema_query do
    author { User.first || FactoryBot.create(:user, :admin) }
    default { false }
    db_type { :psql }
    query do
      Rack::Test::UploadedFile.new(
        File.join('lib/queries', db_type.to_s, 'database_schema.sql'),
        'text/plain'
      )
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
    db_type { :psql }
    host { 'localhost' }
    port { DbServer::DEFAULT_PORT_PSQL }
    username { 'foo' }
    initialization_vector { crypt[:initialization_vector] }
    password_encrypted { crypt[:encrypted_password] }
    association :user, factory: :user
    database_schema_query do
      DatabaseSchemaQuery.default(db_type: db_type) ||
        FactoryBot.create(:database_schema_query, db_type: db_type, default: true)
    end
  end
end
