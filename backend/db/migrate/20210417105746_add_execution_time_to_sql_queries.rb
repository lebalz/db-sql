class AddExecutionTimeToSqlQueries < ActiveRecord::Migration[6.1]
  def change
    add_column :sql_queries, :exec_time, :float
    add_column :sql_queries, :error, :json, default: []
  end
end
