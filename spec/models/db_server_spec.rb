# frozen_string_literal: true

# == Schema Information
#
# Table name: db_servers
#
#  id                       :uuid             not null, primary key
#  db_type                  :integer
#  default_sql_limit        :integer          default(500)
#  error_query_count        :integer          default(0)
#  host                     :string
#  initial_db               :string
#  initial_table            :string
#  initialization_vector    :string
#  name                     :string
#  password_encrypted       :string
#  port                     :integer
#  query_count              :integer          default(0)
#  username                 :string
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  database_schema_query_id :uuid
#  group_id                 :uuid
#  user_id                  :uuid
#
# Indexes
#
#  index_db_servers_on_database_schema_query_id  (database_schema_query_id)
#  index_db_servers_on_group_id                  (group_id)
#  index_db_servers_on_user_id                   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (database_schema_query_id => database_schema_queries.id)
#  fk_rails_...  (group_id => groups.id)
#  fk_rails_...  (user_id => users.id)
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
