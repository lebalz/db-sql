# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2020_06_13_181612) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "uuid-ossp"

  create_table "database_schema_queries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "description"
    t.integer "db_type", null: false
    t.boolean "is_default", default: false, null: false
    t.boolean "is_private", default: false, null: false
    t.uuid "author_id", null: false
    t.string "query", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["author_id"], name: "index_database_schema_queries_on_author_id"
  end

  create_table "db_servers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id"
    t.string "name"
    t.integer "db_type"
    t.string "host"
    t.integer "port"
    t.string "password_encrypted"
    t.string "initialization_vector"
    t.string "initial_db"
    t.string "initial_table"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.integer "query_count", default: 0
    t.integer "error_query_count", default: 0
    t.uuid "database_schema_query_id"
    t.uuid "group_id"
    t.index ["database_schema_query_id"], name: "index_db_servers_on_database_schema_query_id"
    t.index ["group_id"], name: "index_db_servers_on_group_id"
    t.index ["user_id"], name: "index_db_servers_on_user_id"
  end

  create_table "group_members", primary_key: ["user_id", "group_id"], force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "group_id", null: false
    t.string "crypto_key_encrypted"
    t.boolean "is_admin", default: false, null: false
    t.boolean "is_outdated", default: false, null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["group_id"], name: "index_group_members_on_group_id"
    t.index ["user_id"], name: "index_group_members_on_user_id"
  end

  create_table "groups", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "description", default: ""
    t.string "public_crypto_key"
    t.boolean "is_private", default: true, null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "login_tokens", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "token"
    t.uuid "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_login_tokens_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "login_count", default: 0
    t.integer "role", default: 0
    t.string "activation_digest"
    t.datetime "activated_at"
    t.string "reset_password_digest"
    t.datetime "reset_password_mail_sent_at"
    t.string "private_key_pem"
    t.string "public_key_pem"
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "database_schema_queries", "users", column: "author_id"
  add_foreign_key "db_servers", "database_schema_queries"
  add_foreign_key "db_servers", "groups"
  add_foreign_key "db_servers", "users"
  add_foreign_key "group_members", "groups"
  add_foreign_key "group_members", "users"
  add_foreign_key "login_tokens", "users"
end
