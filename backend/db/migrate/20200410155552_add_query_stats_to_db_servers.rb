class AddQueryStatsToDbServers < ActiveRecord::Migration[6.0]
  def change
    add_column :db_servers, :query_count, :integer, default: 0
    add_column :db_servers, :error_query_count, :integer, default: 0
  end
end
