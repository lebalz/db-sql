# frozen_string_literal: true
require_relative '../rails_helper.rb'

RSpec.describe "API::Resources::DbConnection" do
  before(:all) do
    pw = ENV.fetch("DB_SQL_DATABASE_PASSWORD") { '' }
    sql_path = Rails.root.join('spec', 'fixtures', 'database', 'ninja_turtles_create.sql')
    `env PGPASSWORD="#{pw}" bundle exec rails db < #{sql_path}`
    @db_connection = FactoryBot.create(:db_connection)

    @user = @db_connection.user
    login_token = FactoryBot.create(:login_token, user: @user)
    @crypto_key = @user.crypto_key('asdfasdf')
    @headers = {
      'Authorization' => login_token.token,
      'Crypto-Key' => @crypto_key
    }
  end
  after(:all) do
    pw = ENV.fetch("DB_SQL_DATABASE_PASSWORD") { '' }
    sql_path = Rails.root.join('spec', 'fixtures', 'database', 'ninja_turtles_drop.sql')
    `env PGPASSWORD="#{pw}" bundle exec rails db < #{sql_path}`
  end

  describe 'GET /api/db_connections' do
    it 'can get all connections of current user' do
      get(
        "/api/db_connections",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      
      expect(json[0]['db_type']).to eq(@db_connection.db_type)
      expect(json[0]['host']).to eq(@db_connection.host)
      expect(json[0]['initial_db']).to eq(nil)
      expect(json[0]['initial_schema']).to eq(nil)
      expect(json[0]['initialization_vector']).not_to be_empty
      expect(json[0]['name']).to eq(@db_connection.name)
      expect(json[0]['password_encrypted']).not_to eq("asdfasdf")
      expect(json[0]['port']).to eq(@db_connection.port)
      expect(json[0]['user_id']).to eq(@db_connection.user.id)
      expect(json[0]['username']).to eq(@db_connection.username)
    end
  end

  describe 'POST /api/db_connections' do
    let(:params) do
      {
        name: 'test db connection',
        db_type: 'mysql',
        host: 'localhost',
        port: 1234,
        username: 'foobar',
        password: 'retoholz'
      }
    end
    it 'can create a new db connection' do
      expect(DbConnection.all.size).to be(1)
      post(
        "/api/db_connections",
        headers: @headers,
        params: params
      )
      expect(response.successful?).to be_truthy

      expect(json['db_type']).to eq("mysql")
      expect(json['host']).to eq("localhost")
      expect(json['initial_db']).to eq(nil)
      expect(json['initial_schema']).to eq(nil)
      expect(json['initialization_vector']).not_to be_empty
      expect(json['name']).to eq("test db connection")
      expect(json['password_encrypted']).not_to eq("retoholz")
      expect(json['port']).to eq(1234)
      expect(json['user_id']).to eq(@user.id)
      expect(json['username']).to eq("foobar")
      expect(DbConnection.all.size).to be(2)
      DbConnection.find(json['id']).destroy!
    end
  end

  describe 'PUT /api/db_connections/:id' do
    it 'can update :name of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.name).not_to eq('funny-name')
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            name: 'funny-name'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['name']).to eq('funny-name')
      db_connection.reload
      expect(db_connection.name).to eq('funny-name')
      db_connection.destroy!
    end
    it 'can update :db_type of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.db_type).not_to eq('mariadb')
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            db_type: 'mariadb'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['db_type']).to eq('mariadb')
      db_connection.reload
      expect(db_connection.db_type).to eq('mariadb')
      db_connection.destroy!
    end
    it 'can update :host of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.host).to eq('localhost')
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            host: '192.168.1.1'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['host']).to eq('192.168.1.1')
      db_connection.reload
      expect(db_connection.host).to eq('192.168.1.1')
      db_connection.destroy!
    end
    it 'can update :initial_db of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.initial_db).to be_nil
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            initial_db: 'foobar'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['initial_db']).to eq('foobar')
      db_connection.reload
      expect(db_connection.initial_db).to eq('foobar')
      db_connection.destroy!
    end
    it 'can update :initial_schema of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.initial_schema).to be_nil
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            initial_schema: 'foobar'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['initial_schema']).to eq('foobar')
      db_connection.reload
      expect(db_connection.initial_schema).to eq('foobar')
      db_connection.destroy!
    end
    it 'can update :port of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.port).to be(5432)
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            port: 1111
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['port']).to be(1111)
      db_connection.reload
      expect(db_connection.port).to eq(1111)
      db_connection.destroy!
    end
    it 'can update :username of a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(db_connection.username).to eq('foo')
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            username: 'bar'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['username']).to eq('bar')
      db_connection.reload
      expect(db_connection.username).to eq('bar')
      db_connection.destroy!
    end
    it 'can update :password of a db connection' do
      db_connection = FactoryBot.create(:db_connection, user: @user)
      expect(db_connection.password(@crypto_key)).to eq('safe-db-password')
      put(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers,
        params: {
          data: {
            password: 'safer-pw$$1z^^'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['password']).to be_nil
      db_connection.reload
      expect(db_connection.password(@crypto_key)).to eq('safer-pw$$1z^^')
      db_connection.destroy!
    end
  end

  
  describe 'DELETE /api/db_connections/:id' do
    it 'can delete a db connection' do
      db_connection = FactoryBot.create(:db_connection)
      expect(DbConnection.all.size).to be(2)
      delete(
        "/api/db_connections/#{db_connection.id}",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(DbConnection.all.size).to be(1)
    end
  end

  describe 'GET /api/db_connections/:id/database_names' do
    it 'can list database names of a connection' do
      get(
        "/api/db_connections/#{@db_connection.id}/database_names",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json).to include("ninja_turtles_db")
    end
  end

  describe 'GET /api/db_connections/:id/password' do
    it 'can get cleartext password' do
      get(
        "/api/db_connections/#{@db_connection.id}/password",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(response.body).to include("safe-db-password")
    end
  end

  describe 'POST /api/db_connections/:id/:database_name/query' do
    let(:params) do
      {
        query: "SELECT * FROM ninja_turtles"
      }
    end
    it 'can query the database' do
      post(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/query",
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

  describe 'GET /api/db_connections/:id/:database_name/table_names' do
    it 'can get table names of a database' do
      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/table_names",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq('fights')
      expect(json[1]).to eq('ninja_turtles')
    end
  end

  describe 'GET /api/db_connections/:id/:database_name/:table_name/indexes' do
    it 'can get indexes of a table' do
      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/ninja_turtles/indexes",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(0)

      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/fights/indexes",
        headers: @headers
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

  describe 'GET /api/db_connections/:id/:database_name/:table_name/foreign_keys' do
    it 'can get indexes of a table' do
      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/ninja_turtles/foreign_keys",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(0)

      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/fights/foreign_keys",
        headers: @headers
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

  describe 'GET /api/db_connections/:id/:database_name/:table_name/primary_key_names' do
    it 'can get indexes of a table' do
      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/ninja_turtles/primary_key_names",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json.first).to eq('id')

      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/fights/primary_key_names",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json.first).to eq('id')
    end
  end
  describe 'GET /api/db_connections/:id/:database_name/:table_name/columns' do
    it 'can get columns of a table' do
      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/ninja_turtles/columns",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq({
        "name" => "id",
        "default_function" => "nextval('ninja_turtles_id_seq'::regclass)",
        "null" => false,
        "serial" =>true,
        "sql_type_metadata" =>{
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      })
      expect(json[1]).to eq({
        "name" => "name",
        "null" => true,
        "sql_type_metadata" =>{
          "sql_type" => "text",
          "type" => "text"
        }
      })

      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/fights/columns",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(4)
      expect(json[0]).to eq({
        "name" => "id",
        "default_function" => "nextval('fights_id_seq'::regclass)",
        "null" => false,
        "serial" =>true,
        "sql_type_metadata" =>{
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      })
      expect(json[1]).to eq({
        "name" => "date",
        "null" => true,
        "sql_type_metadata" => {
          "sql_type" => "timestamp without time zone",
          "type" => "datetime"
        }
      })
      expect(json[2]).to eq({
        "name" => "badass_turtle_id",
        "null" => true,
        "sql_type_metadata" => {
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      })
      expect(json[3]).to eq({
        "name" => "kickass_turtle_id",
        "null" => true,
        "sql_type_metadata" => {
          "limit" => 4,
          "sql_type" => "integer",
          "type" => "integer"
        }
      })
    end
  end
  describe 'GET /api/db_connections/:id/:database_name/:table_name/column_names' do
    it 'can get column names of a table' do
      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/ninja_turtles/column_names",
        headers: @headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]).to eq('id')
      expect(json[1]).to eq('name')

      get(
        "/api/db_connections/#{@db_connection.id}/ninja_turtles_db/fights/column_names",
        headers: @headers
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
