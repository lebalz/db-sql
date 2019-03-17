class CreateLoginTokens < ActiveRecord::Migration[5.2]
  def change
    create_table :login_tokens, id: :uuid do |t|
      t.string :token
      t.belongs_to :user, type: :uuid, null: false, index: true

      t.timestamps
    end
  end
end
