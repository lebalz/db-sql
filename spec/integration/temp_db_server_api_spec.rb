# frozen_string_literal: true

require_relative '../rails_helper.rb'
require_relative './helpers'

RSpec.configure do |c|
  c.include Helpers
end

RSpec.describe "API::Resources::TempDbServer" do
  RSpec.shared_examples 'common temp database specs' do
    describe 'POST /api/temp_db_server/test' do
      it 'returns true for a successful server test' do
        post(
          "/api/temp_db_server/test",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json).to eq('success' => true)
      end
      it 'returns false and the errormessage for a failed server test' do
        post(
          "/api/temp_db_server/test",
          headers: @headers,
          params: {
            db_type: 'mysql',
            host: 'localhost',
            port: DbServer::DEFAULT_PORT_PSQL,
            username: 'foo',
            password: 'safe-db-password'
          }
        )
        expect(response.successful?).to be_truthy
        expect(json).to eq('success' => false, 'message' => "Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)")
      end
    end

    describe 'POST /api/temp_db_server/database_names' do
      it 'can list database names of a temporary db server' do
        post(
          "/api/temp_db_server/database_names",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json).to include("ninja_turtles_db")
      end
    end

    describe 'POST /api/temp_db_server/databases' do
      it 'can list database names of a temporary db server' do
        post(
          "/api/temp_db_server/databases",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json).to include("name" => "ninja_turtles_db")
      end
    end

    describe 'POST /api/temp_db_server/:database_name/query' do
      let(:params) do
        {
          query: "SELECT * FROM ninja_turtles",
          **@temp_db_server
        }
      end
      it 'can query a temp database' do
        post(
          "/api/temp_db_server/ninja_turtles_db/query",
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

    describe 'POST /api/temp_db_server/:database_name/table_names' do
      it 'can get table names of a database' do
        post(
          "/api/temp_db_server/ninja_turtles_db/table_names",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('fights')
        expect(json[1]).to eq('ninja_turtles')
      end
    end

    describe 'POST /api/temp_db_server/:database_name/table_names' do
      it 'can get table names of a database' do
        post(
          "/api/temp_db_server/ninja_turtles_db/tables",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('name' => 'fights')
        expect(json[1]).to eq('name' => 'ninja_turtles')
      end
    end

    describe 'POST /api/temp_db_server/:database_name/:table_name/indexes' do
      it 'can get indexes of a table' do
        post(
          "/api/temp_db_server/ninja_turtles_db/ninja_turtles/indexes",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(0)

        post(
          "/api/temp_db_server/ninja_turtles_db/fights/indexes",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)

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

    describe 'POST /api/temp_db_server/:database_name/:table_name/foreign_keys' do
      it 'can get foreign keys of a table' do
        post(
          "/api/temp_db_server/ninja_turtles_db/ninja_turtles/foreign_keys",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(0)

        post(
          "/api/temp_db_server/ninja_turtles_db/fights/foreign_keys",
          headers: @headers,
          params: @temp_db_server
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

    describe 'POST /api/temp_db_server/:database_name/:table_name/primary_key_names' do
      it 'can get primary keys of a table' do
        post(
          "/api/temp_db_server/ninja_turtles_db/ninja_turtles/primary_key_names",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(1)
        expect(json.first).to eq('id')

        post(
          "/api/temp_db_server/ninja_turtles_db/fights/primary_key_names",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(1)
        expect(json.first).to eq('id')
      end
    end
    describe 'POST /api/temp_db_server/:database_name/:table_name/columns' do
      it 'can get columns of a table' do
        post(
          "/api/temp_db_server/ninja_turtles_db/ninja_turtles/columns",
          headers: @headers,
          params: @temp_db_server
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

        post(
          "/api/temp_db_server/ninja_turtles_db/fights/columns",
          headers: @headers,
          params: @temp_db_server
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

    describe 'POST /api/temp_db_server/:database_name/:table_name/column_names' do
      it 'can get column names of a table' do
        post(
          "/api/temp_db_server/ninja_turtles_db/ninja_turtles/column_names",
          headers: @headers,
          params: @temp_db_server
        )
        expect(response.successful?).to be_truthy
        expect(json.size).to be(2)
        expect(json[0]).to eq('id')
        expect(json[1]).to eq('name')

        post(
          "/api/temp_db_server/ninja_turtles_db/fights/column_names",
          headers: @headers,
          params: @temp_db_server
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

  describe 'with psql 9.3' do
    before(:all) do
      temp_db_config_for(db_version: 'p9.3')
    end
    include_examples 'common temp database specs'
  end

  describe 'with psql 10' do
    before(:all) do
      temp_db_config_for(db_version: 'p10')
    end
    include_examples 'common temp database specs'
  end

  describe 'with psql 11' do
    before(:all) do
      temp_db_config_for(db_version: 'p11')
    end
    include_examples 'common temp database specs'
  end

  describe 'with psql 12' do
    before(:all) do
      temp_db_config_for(db_version: 'p12')
    end
    include_examples 'common temp database specs'
  end

  describe 'with mysql 5.6' do
    before(:all) do
      temp_db_config_for(db_version: 'm5.6')
    end
    include_examples 'common temp database specs'
  end

  describe 'with mysql 5.7' do
    before(:all) do
      temp_db_config_for(db_version: 'm5.7')
    end
    include_examples 'common temp database specs'
  end

  describe 'with mysql 8' do
    before(:all) do
      temp_db_config_for(db_version: 'm8')
    end
    include_examples 'common temp database specs'
  end
end
