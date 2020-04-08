# frozen_string_literal: true

# == Schema Information
#
# Table name: db_servers
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
#  initial_table        :string
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  username              :string
#

require_relative '../rails_helper'

RSpec.describe DbServer, type: :model do
  describe 'database server' do
    it 'can create new database server and restore decrypted password' do
      user = FactoryBot.create(:user)
      key = user.crypto_key('asdfasdf')
      encrypted_password = DbServer.encrypt(
        key: key,
        db_password: 'safe-db-password'
      )
      db_server = DbServer.create!(
        user: user,
        name: 'test',
        db_type: DbServer.db_types[:psql],
        host: 'localhost',
        port: DbServer::DEFAULT_PORT_PSQL,
        password_encrypted: encrypted_password[:encrypted_password],
        initialization_vector: encrypted_password[:initialization_vector],
        initial_db: 'test_db',
        initial_table: 'test_schema'
      )
      expect(db_server.valid?).to be_truthy
      expect(db_server.password_encrypted).not_to eq('safe-db-password')
      expect(db_server.password(key)).to eq('safe-db-password')
    end
  end
end
