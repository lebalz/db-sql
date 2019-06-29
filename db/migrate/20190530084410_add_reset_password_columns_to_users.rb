class AddResetPasswordColumnsToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :reset_password_digest, :string
    add_column :users, :reset_password_mail_sent_at, :datetime
  end
end
