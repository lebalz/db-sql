class AddKeysToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :private_key_pem, :string
    add_column :users, :public_key_pem, :string
    # since the key pair can only be generated on login when creating a new user
    # all login tokens must be deleted for this migration
    LoginToken.all.destroy_all
  end
end
