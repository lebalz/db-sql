class ConvertCompositeKeysToIndexedFields < ActiveRecord::Migration[6.0]
  def up
    add_index :group_members, [:user_id, :group_id], unique: true
    execute <<-SQL
      ALTER TABLE group_members DROP CONSTRAINT "group_members_pkey"
    SQL
    add_column :group_members, :id, :primary_key
  end

  def down
    remove_index :group_members, [:user_id, :group_id]
    execute <<-SQL
      ALTER TABLE group_members DROP CONSTRAINT "group_members_pkey"
    SQL
    remove_column :group_members, :id, :integer
    execute <<-SQL
      ALTER TABLE group_members ADD PRIMARY KEY (user_id, group_id)
    SQL
  end
end
