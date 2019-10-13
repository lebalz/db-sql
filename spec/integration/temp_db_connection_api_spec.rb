# frozen_string_literal: true

require_relative '../rails_helper.rb'

RSpec.describe "API::Resources::TempDbConnection" do
  before(:all) do
    pw = Rails.configuration.database_configuration[Rails.env]['password']
    sql_path = Rails.root.join(
      'spec',
      'fixtures',
      'database',
      'ninja_turtles_create.sql'
    )
    `env PGPASSWORD="#{pw}" bundle exec rails db < #{sql_path}`
    @temp_db_connection = {
      db_type: 'psql',
      host: 'localhost',
      port: DbConnection::DEFAULT_PORT_PSQL,
      username: 'foo',
      password: 'safe-db-password'
    }
    @user = FactoryBot.create(:user)
    login_token = FactoryBot.create(:login_token, user: @user)
    @crypto_key = @user.crypto_key('asdfasdf')
    @headers = {
      'Authorization' => login_token.token,
      'Crypto-Key' => @crypto_key
    }
  end
  after(:all) do
    pw = Rails.configuration.database_configuration[Rails.env]['password']
    sql_path = Rails.root.join(
      'spec',
      'fixtures',
      'database',
      'ninja_turtles_drop.sql'
    )
    `env PGPASSWORD="#{pw}" bundle exec rails db < #{sql_path}`
  end

  describe 'POST /api/temp_db_connection/test' do
    it 'returns true for a successful connection test' do
      post(
        "/api/temp_db_connection/test",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json).to eq('success' => true)
    end
    it 'returns false and the errormessage for a failed connection test' do
      post(
        "/api/temp_db_connection/test",
        headers: @headers,
        params: {
          db_type: 'mysql',
          host: 'localhost',
          port: DbConnection::DEFAULT_PORT_PSQL,
          username: 'foo',
          password: 'safe-db-password'
        }
      )
      expect(response.successful?).to be_truthy
      expect(json).to eq('success' => false, 'message' => "Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)")
    end
  end

  describe 'POST /api/temp_db_connection/database_names' do
    it 'can list database names of a temporary db connection' do
      post(
        "/api/temp_db_connection/database_names",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json).to include("ninja_turtles_db")
    end
  end

  describe 'POST /api/temp_db_connection/databases' do
    it 'can list database names of a temporary db connection' do
      post(
        "/api/temp_db_connection/databases",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json).to include("name" => "ninja_turtles_db")
    end
  end

  describe 'POST /api/temp_db_connection/:database_name/query' do
    let(:params) do
      {
        query: "SELECT * FROM ninja_turtles",
        **@temp_db_connection
      }
    end
    it 'can query a temp database' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/query",
        headers: @headers,
        params: params
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(3)
      expect(json[0]['name']).to eq('Ninja Reto')
      expect(json[1]['name']).to eq('Warrior Maria')
      expect(json[2]['name']).to eq('Mutant Holzkopf')
    end
  end

  describe 'POST /api/temp_db_connection/:database_name/table_names' do
    it 'can get table names of a database' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/table_names",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq('fights')
      expect(json[1]).to eq('ninja_turtles')
    end
  end

  describe 'POST /api/temp_db_connection/:database_name/table_names' do
    it 'can get table names of a database' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/tables",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq('name' => 'fights')
      expect(json[1]).to eq('name' => 'ninja_turtles')
    end
  end

  describe 'POST /api/temp_db_connection/:database_name/:table_name/indexes' do
    it 'can get indexes of a table' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/ninja_turtles/indexes",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(0)

      post(
        "/api/temp_db_connection/ninja_turtles_db/fights/indexes",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json[0]['columns'][0]).to eq('badass_turtle_id')
      expect(json[0]['name']).to eq('badass_idx')
      expect(json[0]['table']).to eq('fights')
      expect(json[0]['using']).to eq('btree')
      expect(json[0]['unique']).to eq(false)
    end
  end

  describe 'POST /api/temp_db_connection/:database_name/:table_name/foreign_keys' do
    it 'can get indexes of a table' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/ninja_turtles/foreign_keys",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(0)

      post(
        "/api/temp_db_connection/ninja_turtles_db/fights/foreign_keys",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      # first foreign key
      expect(json[0]['from_table']).to eq('fights')
      expect(json[0]['to_table']).to eq('ninja_turtles')
      options = json[0]['options']
      expect(options['column']).to eq('badass_turtle_id')
      expect(options['primary_key']).to eq('id')

      # second foreign key
      expect(json[1]['from_table']).to eq('fights')
      expect(json[1]['to_table']).to eq('ninja_turtles')
      options = json[1]['options']
      expect(options['column']).to eq('kickass_turtle_id')
      expect(options['primary_key']).to eq('id')
    end
  end

  describe 'POST /api/temp_db_connection/:database_name/:table_name/primary_key_names' do
    it 'can get indexes of a table' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/ninja_turtles/primary_key_names",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json.first).to eq('id')

      post(
        "/api/temp_db_connection/ninja_turtles_db/fights/primary_key_names",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json.first).to eq('id')
    end
  end
  describe 'POST /api/temp_db_connection/:database_name/:table_name/columns' do
    it 'can get columns of a table' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/ninja_turtles/columns",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq(
        "name" => "id",
        "is_primary" => true,
        "default_function" => "nextval('ninja_turtles_id_seq'::regclass)",
        "null" => false,
        "serial" => true,
        "sql_type_metadata" => {
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      )
      expect(json[1]).to eq(
        "name" => "name",
        "is_primary" => false,
        "null" => true,
        "sql_type_metadata" => {
          "sql_type" => "text",
          "type" => "text"
        }
      )

      post(
        "/api/temp_db_connection/ninja_turtles_db/fights/columns",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(4)
      expect(json[0]).to eq(
        "name" => "id",
        "is_primary" => true,
        "default_function" => "nextval('fights_id_seq'::regclass)",
        "null" => false,
        "serial" => true,
        "sql_type_metadata" => {
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      )
      expect(json[1]).to eq(
        "name" => "date",
        "is_primary" => false,
        "null" => true,
        "sql_type_metadata" => {
          "sql_type" => "timestamp without time zone",
          "type" => "datetime"
        }
      )
      expect(json[2]).to eq(
        "name" => "badass_turtle_id",
        "is_primary" => false,
        "null" => true,
        "sql_type_metadata" => {
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      )
      expect(json[3]).to eq(
        "name" => "kickass_turtle_id",
        "is_primary" => false,
        "null" => true,
        "sql_type_metadata" => {
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      )
    end
  end
  describe 'POST /api/temp_db_connection/:database_name/:table_name/column_names' do
    it 'can get column names of a table' do
      post(
        "/api/temp_db_connection/ninja_turtles_db/ninja_turtles/column_names",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq('id')
      expect(json[1]).to eq('name')

      post(
        "/api/temp_db_connection/ninja_turtles_db/fights/column_names",
        headers: @headers,
        params: @temp_db_connection
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(4)
      expect(json[0]).to eq('id')
      expect(json[1]).to eq('date')
      expect(json[2]).to eq('badass_turtle_id')
      expect(json[3]).to eq('kickass_turtle_id')
    end
  end
end
