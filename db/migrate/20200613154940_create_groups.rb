class CreateGroups < ActiveRecord::Migration[6.0]
  def change
    create_table :groups, id: :uuid do |t|
      t.string :name, null: false
      t.boolean :is_private, default: true, null: false
      t.timestamps
    end

    # join table
    create_table :users_groups, :id => false do |t|
      t.references :user, type: :uuid, null: false, index: true
      t.references :group, type: :uuid, null: false, index: true
      # crypto key for the db password, encrypted with the users public key 
      t.string :crypto_key_encrypted, null: false
      t.boolean :is_admin, default: false, null: false
      t.timestamps
    end
    add_foreign_key :users_groups, :users, column: :user_id
    add_foreign_key :users_groups, :groups, column: :group_id

    add_reference :db_servers, :group, type: :uuid, index: true
    add_foreign_key :db_servers, :groups
  end
end
