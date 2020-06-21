class CreateGroups < ActiveRecord::Migration[6.0]
  def change
    create_table :groups, id: :uuid do |t|
      t.string :name, null: false
      t.string :public_crypto_key
      t.boolean :is_private, default: true, null: false
      t.timestamps
    end

    # join table
    create_table :group_members, primary_key: %i[user_id group_id] do |t|
      t.references :user, type: :uuid, null: false, index: true
      t.references :group, type: :uuid, null: false, index: true

      # crypto key for the db password, encrypted with the users public key
      t.string :crypto_key_encrypted
      t.boolean :is_admin, default: false, null: false
      t.boolean :is_outdated, default: false, null: false
      t.timestamps
    end
    add_foreign_key :group_members, :users, column: :user_id
    add_foreign_key :group_members, :groups, column: :group_id

    add_reference :db_servers, :group, type: :uuid, index: true
    add_foreign_key :db_servers, :groups
  end
end
