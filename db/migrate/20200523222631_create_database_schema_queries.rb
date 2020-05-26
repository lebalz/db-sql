class CreateDatabaseSchemaQueries < ActiveRecord::Migration[6.0]
  def change
    create_table :database_schema_queries, id: :uuid do |t|
      t.integer :db_type, null: false
      t.boolean :default, default: false, null: false
      t.references :author, type: :uuid, null: false, index: true
      t.string :query, null: false
      t.timestamps
    end

    add_reference :db_servers, :database_schema_query, type: :uuid, index: true
    add_foreign_key :database_schema_queries, :users, column: :author_id
    add_foreign_key :db_servers, :database_schema_queries
  end
end
