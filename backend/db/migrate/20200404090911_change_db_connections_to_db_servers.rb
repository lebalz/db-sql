class ChangeDbConnectionsToDbServers < ActiveRecord::Migration[6.0]
  def change
    rename_table :db_connections, :db_servers
  end
end
