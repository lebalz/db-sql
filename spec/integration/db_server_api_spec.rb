# frozen_string_literal: true

require_relative '../rails_helper.rb'
require_relative './helpers'

RSpec.configure do |c|
  c.include Helpers
end

RSpec.describe "API::Resources::DbServer" do
  RSpec.shared_examples 'common database specs' do
    describe 'GET /api/db_servers' do
      it 'can get all database servers of the current owner' do
        get(
          "/api/db_servers?include_shared=true",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(1)

        expect(json[0]['db_type']).to eq(@db_server.db_type)
        expect(json[0]['host']).to eq(@db_server.host)
        expect(json[0]['initial_db']).to eq(nil)
        expect(json[0]['initial_table']).to eq(nil)
        expect(json[0]['initialization_vector']).not_to be_empty
        expect(json[0]['name']).to eq(@db_server.name)
        expect(json[0]['password_encrypted']).not_to eq("asdfasdf")
        expect(json[0]['port']).to eq(@db_server.port)
        expect(json[0]['owner_id']).to eq(@db_server.owner.id)
        expect(json[0]['owner_type']).to eq(@owner_type.to_s)
        expect(json[0]['username']).to eq(@db_server.username)
      end
    end

    describe 'GET /api/db_servers/:id/databases' do
      it 'can list databases of a server' do
        get(
          "/api/db_servers/#{@db_server.id}/databases",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json).to include(
          {
            "name" => "ninja_turtles_db",
            "db_server_id" => @db_server.id
          }
        )
      end
    end

    describe 'GET /api/db_servers/:id/database_names' do
      it 'can list database names of a server' do
        get(
          "/api/db_servers/#{@db_server.id}/database_names",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json).to include("ninja_turtles_db")
      end
    end

    describe 'GET /api/db_servers/:id/password' do
      it 'can get cleartext password' do
        get(
          "/api/db_servers/#{@db_server.id}/password",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(response.body).to include("safe-db-password")
      end
    end

    describe 'POST /api/db_servers/:id/:database_name/query' do
      let(:params) do
        {
          query: "SELECT * FROM ninja_turtles"
        }
      end
      it 'can query the database' do
        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/query",
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

    describe 'POST /api/db_servers/:id/:database_name/multi_query' do
      let(:params) do
        {
          queries: [
            "SELECT id FROM ninja_turtles",
            "SELECT name FROM ninja_turtles"
          ]
        }
      end
      it 'can exeute multiple queries on the database' do
        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/multi_query",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)

        json.each do |query_result|
          expect(query_result["state"]).to eq("success")
          expect(query_result["result"].length).to be(3)
          expect(query_result["time"]).to be > 0
        end

        expect(json[0]["result"][0]).to eq({ "id" => 1 })
        expect(json[0]["result"][1]).to eq({ "id" => 2 })
        expect(json[0]["result"][2]).to eq({ "id" => 3 })

        expect(json[1]["result"][0]).to eq({ "name" => 'Ninja Reto' })
        expect(json[1]["result"][1]).to eq({ "name" => 'Warrior Maria' })
        expect(json[1]["result"][2]).to eq({ "name" => 'Mutant Holzkopf' })
      end

      it 'can proceed after erroneous query' do

        params[:queries][0] = "SELECT no_row FROM ninja_turtles"

        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/multi_query",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)

        expect(json[0]["state"]).to eq("error")
        expect(json[0]["result"]).to be_nil
        if @db_server.psql?
          expect(json[0]["error"]).to start_with 'PG::UndefinedColumn: ERROR:  column "no_row" does not exist'
        elsif @db_server.mysql? || @db_server.mariadb?
          expect(json[0]["error"]).to start_with "Mysql2::Error: Unknown column 'no_row' in 'field list'"
        end
        expect(json[0]["time"]).to be > 0

        expect(json[1]["state"]).to eq("success")
        expect(json[1]["result"].length).to be(3)
        expect(json[1]["time"]).to be > 0
        expect(json[1]["error"]).to be_nil

        expect(json[1]["result"][0]).to eq({ "name" => 'Ninja Reto' })
        expect(json[1]["result"][1]).to eq({ "name" => 'Warrior Maria' })
        expect(json[1]["result"][2]).to eq({ "name" => 'Mutant Holzkopf' })
      end

      it 'can skip query execution after erroneous query' do

        params[:queries][2] = params[:queries][1]
        params[:queries][1] = "SELECT no_row FROM ninja_turtles"

        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/multi_query",
          headers: @headers,
          params: params.merge({ proceed_after_error: false })
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(3)

        expect(json[0]["state"]).to eq("success")
        expect(json[1]["state"]).to eq("error")
        expect(json[2]["state"]).to eq("skipped")
        expect(json[2]["result"]).to be_nil
        expect(json[2]["error"]).to be_nil
        expect(json[2]["time"]).to be(0)
      end
    end

    describe 'POST /api/db_servers/:id/:database_name/raw_query' do
      let(:params) do
        {
          query: "SELECT id FROM ninja_turtles; SELECT name FROM ninja_turtles"
        }
      end
      it 'can exeute multiple queries on the database' do
        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/raw_query",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_truthy

        expect(json["state"]).to eq("success")
        expect(json["result"].length).to be(2)
        expect(json["time"]).to be > 0

        expect(json["result"][0][0]).to eq({ "id" => 1 })
        expect(json["result"][0][1]).to eq({ "id" => 2 })
        expect(json["result"][0][2]).to eq({ "id" => 3 })

        expect(json["result"][1][0]).to eq({ "name" => 'Ninja Reto' })
        expect(json["result"][1][1]).to eq({ "name" => 'Warrior Maria' })
        expect(json["result"][1][2]).to eq({ "name" => 'Mutant Holzkopf' })
      end

      it 'can exeute queries without result' do
        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/raw_query",
          headers: @headers,
          params: { query: "CREATE TABLE raw_test ( id int primary key );" }
        )
        expect(response.successful?).to be_truthy
        expect(json["state"]).to eq("success")
        expect(json["result"].length).to be(1)
        expect(json["result"][0].length).to be(0)
        expect(json["time"]).to be > 0

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/tables",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(3)
        expect(json[0]).to eq('name' => 'fights')
        expect(json[1]).to eq('name' => 'ninja_turtles')
        expect(json[2]).to eq('name' => 'raw_test')

        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/raw_query",
          headers: @headers,
          params: { query: "DROP TABLE raw_test;" }
        )
        expect(response.successful?).to be_truthy

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/tables",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('name' => 'fights')
        expect(json[1]).to eq('name' => 'ninja_turtles')
      end

      it 'can not return result on error' do

        params[:query] = "SELECT id FROM ninja_turtles; SELECT no_row FROM ninja_turtles"

        post(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/raw_query",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_truthy

        expect(json["state"]).to eq("error")
        expect(json["result"]).to be_nil
        if @db_server.psql?
          expect(json["error"]).to start_with 'ERROR:  column "no_row" does not exist'
        else
          expect(json["error"]).to start_with "Unknown column 'no_row' in 'field list'"
        end
        expect(json["time"]).to be > 0
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/table_names' do
      it 'can get table names of a database' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/table_names",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('fights')
        expect(json[1]).to eq('ninja_turtles')
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/tables' do
      it 'can get tables of a database' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/tables",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('name' => 'fights')
        expect(json[1]).to eq('name' => 'ninja_turtles')
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/:table_name/indexes' do
      it 'can get indexes of a table' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/ninja_turtles/indexes",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(0)

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/fights/indexes",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to eq(2)

        badass_idx = json.index { |meta| meta['name'] == 'badass_idx' }
        kickass_idx = json.index { |meta| meta['name'] == 'kickass_idx' }

        expect(json[kickass_idx]['columns'][0]).to eq('kickass_turtle_id')
        expect(json[kickass_idx]['name']).to eq('kickass_idx')
        expect(json[kickass_idx]['table']).to eq('fights')
        expect(json[kickass_idx]['using']).to eq('btree')
        expect(json[kickass_idx]['unique']).to eq(false)
        expect(json[badass_idx]['columns'][0]).to eq('badass_turtle_id')
        expect(json[badass_idx]['name']).to eq('badass_idx')
        expect(json[badass_idx]['table']).to eq('fights')
        expect(json[badass_idx]['using']).to eq('btree')
        expect(json[badass_idx]['unique']).to eq(false)
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/:table_name/foreign_keys' do
      it 'can get foreign keys of a table' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/ninja_turtles/foreign_keys",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(0)

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/fights/foreign_keys",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)

        badass_idx = json.index { |meta| meta['options']['column'] == 'badass_turtle_id' }
        kickass_idx = json.index { |meta| meta['options']['column'] == 'kickass_turtle_id' }

        # first foreign key
        expect(json[badass_idx]['from_table']).to eq('fights')
        expect(json[badass_idx]['to_table']).to eq('ninja_turtles')
        options = json[badass_idx]['options']
        expect(options['column']).to eq('badass_turtle_id')
        expect(options['primary_key']).to eq('id')

        # second foreign key
        expect(json[kickass_idx]['from_table']).to eq('fights')
        expect(json[kickass_idx]['to_table']).to eq('ninja_turtles')
        options = json[kickass_idx]['options']
        expect(options['column']).to eq('kickass_turtle_id')
        expect(options['primary_key']).to eq('id')
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/:table_name/primary_key_names' do
      it 'can get primary keys of a table' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/ninja_turtles/primary_key_names",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(1)
        expect(json.first).to eq('id')

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/fights/primary_key_names",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(1)
        expect(json.first).to eq('id')
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/:table_name/columns' do
      it 'can get columns of a table' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/ninja_turtles/columns",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to match(
          hash_including("null" => false, "name" => "id", "is_primary" => true)
        )
        expect(json[0]["sql_type_metadata"]).to match(
          hash_including("limit" => 4, "type" => "integer")
        )
        expect(json[1]).to match(
          hash_including("is_primary" => false, "name" => "name", "null" => true)
        )
        expect(json[1]["sql_type_metadata"]).to match(
          hash_including("type" => "text")
        )

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/fights/columns",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(4)

        expect(json[0]).to match(
          hash_including("name" => "id", "is_primary" => true, "null" => false)
        )
        expect(json[0]["sql_type_metadata"]).to match(
          hash_including("limit" => 4, "type" => "integer")
        )
        expect(json[1]).to match(
          hash_including("name" => "date", "is_primary" => false, "null" => true)
        )
        expect(json[1]["sql_type_metadata"]).to match(
          hash_including("type" => "datetime")
        )
        expect(json[2]).to match(
          hash_including("name" => "badass_turtle_id", "is_primary" => false, "null" => true)
        )
        expect(json[2]["sql_type_metadata"]).to match(
          hash_including("limit" => 4, "type" => "integer")
        )
        expect(json[3]).to match(
          hash_including("name" => "kickass_turtle_id", "is_primary" => false, "null" => true)
        )
        expect(json[3]["sql_type_metadata"]).to match(
          hash_including("limit" => 4, "type" => "integer")
        )
      end
    end

    describe 'GET /api/db_servers/:id/:database_name/:table_name/column_names' do
      it 'can get column names of a table' do
        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/ninja_turtles/column_names",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('id')
        expect(json[1]).to eq('name')

        get(
          "/api/db_servers/#{@db_server.id}/ninja_turtles_db/fights/column_names",
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

  RSpec.shared_examples 'common database specs for owners with write rights' do
    describe 'POST /api/db_servers' do
      let(:params) do
        {
          name: 'test db server',
          db_type: 'mysql',
          host: 'localhost',
          port: 1234,
          username: 'foobar',
          password: 'retoholz',
          owner_type: @owner_type,
          owner_id: @owner.id
        }
      end
      it 'can create a new db server' do
        expect(DbServer.all.size).to be(1)
        post(
          "/api/db_servers",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_truthy

        expect(json['db_type']).to eq("mysql")
        expect(json['host']).to eq("localhost")
        expect(json['initial_db']).to eq(nil)
        expect(json['initial_table']).to eq(nil)
        expect(json['initialization_vector']).not_to be_empty
        expect(json['name']).to eq("test db server")
        expect(json['password_encrypted']).not_to eq("retoholz")
        expect(json['port']).to eq(1234)
        expect(json['owner_id']).to eq(@owner.id)
        expect(json['owner_type']).to eq(@owner_type.to_s)
        expect(json['username']).to eq("foobar")
        expect(DbServer.all.size).to be(2)
        DbServer.find(json['id']).destroy!
      end
    end

    describe 'PUT /api/db_servers/:id' do
      it 'can update :name of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.name).not_to eq('funny-name')
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              name: 'funny-name'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['name']).to eq('funny-name')
        db_server.reload
        expect(db_server.name).to eq('funny-name')
        db_server.destroy!
      end
      it 'can update :db_type of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.db_type).not_to eq('mariadb')
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              db_type: 'mariadb'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['db_type']).to eq('mariadb')
        db_server.reload
        expect(db_server.db_type).to eq('mariadb')
        db_server.destroy!
      end
      it 'can update :host of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.host).to eq('127.0.0.1')
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              host: '192.168.1.1'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['host']).to eq('192.168.1.1')
        db_server.reload
        expect(db_server.host).to eq('192.168.1.1')
        db_server.destroy!
      end
      it 'can update :initial_db of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.initial_db).to be_nil
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              initial_db: 'foobar'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['initial_db']).to eq('foobar')
        db_server.reload
        expect(db_server.initial_db).to eq('foobar')
        db_server.destroy!
      end
      it 'can update :initial_table of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.initial_table).to be_nil
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              initial_table: 'foobar'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['initial_table']).to eq('foobar')
        db_server.reload
        expect(db_server.initial_table).to eq('foobar')
        db_server.destroy!
      end
      it 'can update :port of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.port).to be(5432)
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              port: 1111
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['port']).to be(1111)
        db_server.reload
        expect(db_server.port).to eq(1111)
        db_server.destroy!
      end
      it 'can update :username of a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.username).to eq('foo')
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              username: 'bar'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['username']).to eq('bar')
        db_server.reload
        expect(db_server.username).to eq('bar')
        db_server.destroy!
      end
      it 'can update :password of a db server' do
        db_server = FactoryBot.create(:db_server, user: @user)
        expect(db_server.password(@crypto_key)).to eq('safe-db-password')
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              password: 'safer-pw$$1z^^'
            }
          }
        )
        expect(response.successful?).to be_truthy
        expect(json['password']).to be_nil
        db_server.reload
        expect(db_server.password(@crypto_key)).to eq('safer-pw$$1z^^')
        db_server.destroy!
      end
    end

    describe 'DELETE /api/db_servers/:id' do
      it 'can delete a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(DbServer.all.size).to be(2)
        delete(
          "/api/db_servers/#{db_server.id}",
          headers: @headers
        )
        expect(response.successful?).to be_truthy
        expect(DbServer.all.size).to be(1)
      end
    end

  end

  RSpec.shared_examples 'common database server specs for owners with read only rights' do
    describe 'POST /api/db_servers' do
      let(:params) do
        {
          name: 'test db server',
          db_type: 'mysql',
          host: 'localhost',
          port: 1234,
          username: 'foobar',
          password: 'retoholz',
          owner_type: @owner_type,
          owner_id: @owner.id
        }
      end
      it 'can not create a new db server' do
        expect(DbServer.all.size).to be(1)
        post(
          "/api/db_servers",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
      end
    end

    describe 'PUT /api/db_servers/:id' do
      it 'can not update a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(db_server.name).not_to eq('funny-name')
        put(
          "/api/db_servers/#{db_server.id}",
          headers: @headers,
          params: {
            data: {
              name: 'funny-name'
            }
          }
        )
        expect(response.successful?).to be_falsey
      end
    end

    describe 'DELETE /api/db_servers/:id' do
      it 'can not delete a db server' do
        db_server = FactoryBot.create(:db_server)
        expect(DbServer.all.size).to be(2)
        delete(
          "/api/db_servers/#{db_server.id}",
          headers: @headers
        )
        expect(response.successful?).to be_falsey
        expect(DbServer.all.size).to be(2)
      end
    end
  end

  RSpec.shared_examples 'common owner type specs' do
    describe 'with psql 9.3' do
      before(:all) do
        config_for(db_version: 'p9.3', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end

    describe 'with psql 10' do
      before(:all) do
        config_for(db_version: 'p10', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end

    describe 'with psql 11' do
      before(:all) do
        config_for(db_version: 'p11', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access

    end

    describe 'with psql 12' do
      before(:all) do
        config_for(db_version: 'p12', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end

    describe 'with mysql 5.6' do
      before(:all) do
        config_for(db_version: 'm5.6', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end

    describe 'with mysql 5.7' do
      before(:all) do
        config_for(db_version: 'm5.7', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end

    describe 'with mysql 8' do
      before(:all) do
        config_for(db_version: 'm8', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end

    describe 'with mariadb 10.5.3' do
      before(:all) do
        config_for(db_version: 'mariadb_10.5.3', owner_type: @owner_type, read_only_access: @read_only_access)
      end
      after(:all) do
        @db_server.destroy!
      end
      include_examples 'common database specs'
      include_examples 'common database server specs for owners with read only rights' if @read_only_access
      include_examples 'common database specs for owners with write rights' unless @read_only_access
    end
  end

  describe 'with owner_type :user' do
    before(:all) do
      @owner_type = :user
      @readonly_access = false
    end
    include_examples 'common owner type specs'
  end

  describe 'with owner_type :group' do
    before(:all) do
      @owner_type = :group
      @readonly_access = false
    end
    include_examples 'common owner type specs'
  end

  describe 'with owner_type :group and read only access' do
    before(:all) do
      @owner_type = :group
      @readonly_access = true

    end
    include_examples 'common owner type specs'
  end
end
