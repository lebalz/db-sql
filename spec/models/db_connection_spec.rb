# frozen_string_literal: true
require_relative '../rails_helper'

RSpec.describe DbConnection, type: :model do
  describe 'db connection' do
    it 'can create new db_connection and restore decrypted password' do
      user = FactoryBot.create(:user)
      key = user.crypto_key('asdfasdf')
      encrypted_password = DbConnection.encrypt(
        key: key,
        password: 'safe-db-password'
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
