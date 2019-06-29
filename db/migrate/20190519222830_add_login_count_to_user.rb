class AddLoginCountToUser < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :login_count, :integer, default: 0
  end
end
