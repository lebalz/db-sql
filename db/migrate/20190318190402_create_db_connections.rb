class CreateDbConnections < ActiveRecord::Migration[5.2]
  def change
    create_table :db_connections, id: :uuid do |t|
      t.belongs_to :user, type: :uuid, null: :false, index: true
      t.string :name, null: :false
      t.integer :db_type, null: :false
      t.string :host, null: :false
      t.integer :port, null: :false
      t.string :password_encrypted, null: :false
      t.string :iv, null: :false
      t.string :init_db
      t.string :init_schema

      t.timestamps
    end
  end
end
