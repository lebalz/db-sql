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
    initialize_with { User.find_or_create_by(email: email) }
  end

  factory :database_schema_query do
    author { User.first || FactoryBot.create(:user, :admin) }
    is_default { false }
    db_type { :psql }
    name { 'db schema query' }
    query { File.read(File.join(query_path(db_type: db_type), 'database_schema.sql')) }
  end

  factory :group do
    name { 'sharing is caring' }
    is_private { true }
  end

  factory :db_server do
    transient do
      user_password { 'asdfasdf' }
      db_password { 'safe-db-password' }
      key do
        if user
          user.crypto_key(user_password)
        elsif group
          current_user = group.users.first
          group.crypto_key(current_user, current_user.private_key(current_user.crypto_key(user_password)))
        end
      end
      crypt do
        DbServer.encrypt(
          key: key,
          db_password: db_password
        )
      end
    end
    sequence(:name) { |n| "db_server#{n}" }
    db_type { :psql }
    host { '127.0.0.1' }
    port { DbServer::DEFAULT_PORT_PSQL }
    username { 'foo' }
    initialization_vector { crypt[:initialization_vector] }
    password_encrypted { crypt[:encrypted_password] }
    user do
      User.find_by(email: 'sqler1@db.ch') ||
        FactoryBot.create(:user, email: 'sqler1@db.ch')
    end
    database_schema_query do
      DatabaseSchemaQuery.default(db_type) ||
        FactoryBot.create(:database_schema_query, db_type: db_type, default: true)
    end
    trait :psql do
      username { 'postgres' }
    end
    trait :mysql do
      username { 'root' }
    end
    trait :group do
      user { nil }
    end
  end

  factory :sql_query do
    db_server { DbServer.first || FactoryBot.create(:db_server)}
    user { User.first || FactoryBot.create(:user) }
    db_name { 'foobar' }
    is_private { true }
    is_favorite { false }
    is_valid { true }
    exec_time { 0.3 }
    error {[]}
  end

end
