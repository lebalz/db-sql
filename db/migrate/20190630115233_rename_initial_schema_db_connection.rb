class RenameInitialSchemaDbConnection < ActiveRecord::Migration[6.0]
  def change
    rename_column :db_connections, :initial_schema, :initial_table
  end
end
