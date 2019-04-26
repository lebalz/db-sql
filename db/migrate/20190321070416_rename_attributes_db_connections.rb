class RenameAttributesDbConnections < ActiveRecord::Migration[5.2]
  def change
    rename_column :db_connections, :iv, :initialization_vector
    rename_column :db_connections, :init_db, :initial_db
    rename_column :db_connections, :init_schema, :initial_schema
  end
end
