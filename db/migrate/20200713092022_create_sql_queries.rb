class CreateSqlQueries < ActiveRecord::Migration[6.0]
  def change
    create_table :sql_queries, id: :uuid  do |t|
      t.references :db_server, type: :uuid, null: false, index: true
      t.references :user, type: :uuid, null: false, index: true

      t.string :db_name
      t.string :description
      t.boolean :is_valid, default: false
      t.boolean :is_favorite, default: false
      t.boolean :is_private, default: true
      t.timestamps
    end

    add_foreign_key :sql_queries, :db_servers
    add_foreign_key :sql_queries, :users

  end
end
