# frozen_string_literal: true

# == Schema Information
#
# Table name: db_connections
#
#  id                    :uuid             not null, primary key
#  user_id               :uuid
#  name                  :string
#  db_type               :integer
#  host                  :string
#  port                  :integer
#  password_encrypted    :string
#  initialization_vector :string
#  initial_db            :string
#  initial_schema        :string
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  username              :string
#

require_relative '../rails_helper'

RSpec.describe DbConnection, type: :model do
  describe 'db connection' do
    it 'can create new db_connection and restore decrypted password' do
      user = FactoryBot.create(:user)
      key = user.crypto_key('asdfasdf')
      encrypted_password = DbConnection.encrypt(
        key: key,
        db_password: 'safe-db-password'
      )
      db_connection = DbConnection.create!(
        user: user,
        name: 'test',
        db_type: DbConnection.db_types[:psql],
        host: 'localhost',
        port: DbConnection::DEFAULT_PORT_PSQL,
        password_encrypted: encrypted_password[:encrypted_password],
        initialization_vector: encrypted_password[:initialization_vector],
        initial_db: 'test_db',
        initial_schema: 'test_schema'
      )
      expect(db_connection.valid?).to be_truthy
      expect(db_connection.password_encrypted).not_to eq('safe-db-password')
      expect(db_connection.password(key)).to eq('safe-db-password')
    end
  end
end
