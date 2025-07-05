class ChangeDefaultSqlLimitToDbServers < ActiveRecord::Migration[6.1]
  def change
    change_column_default :db_servers, :default_sql_limit, from: 10_000, to: 500
  end
end
