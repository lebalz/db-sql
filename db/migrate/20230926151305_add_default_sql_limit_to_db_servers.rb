class AddDefaultSqlLimitToDbServers < ActiveRecord::Migration[6.1]
  def change
    add_column :db_servers, :default_sql_limit, :integer, default: 10_000
  end
end
