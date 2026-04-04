class AddForeignKeyConstraints < ActiveRecord::Migration[6.0]
  def change
    add_foreign_key "login_tokens", "users"
    add_foreign_key "db_servers", "users"
  end
end
