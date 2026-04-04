class AddUsernameToDbConnections < ActiveRecord::Migration[6.0]
  def change
    add_column :db_connections, :username, :string
  end
end
