# frozen_string_literal: true

require_relative '../rails_helper'
require_relative './helpers'

RSpec.configure do |c|
  c.include Helpers
end

RSpec.describe "API::Resources::SqlQuery" do
  before(:all) do
    config_for(db_version: 'p9.3', email: 'user1@sql.ch')
    @user1 = @user
    @private_db = @db_server
    @user1_token = FactoryBot.create(:login_token, user: @user1)
    @user1_key = @user1.crypto_key('asdfasdf')
    @user1_headers = {
      'Authorization' => @user1_token.token,
      'Crypto-Key' => @user1_key
    }

    config_for(db_version: 'p9.3', owner_type: :group, email: 'user2@sql.ch')
    @group = @owner
    @user2 = @user

    @user2_token = FactoryBot.create(:login_token, user: @user2)
    @user2_key = @user2.crypto_key('asdfasdf')
    @user2_headers = {
      'Authorization' => @user2_token.token,
      'Crypto-Key' => @user2_key
    }
    @shared_db = @db_server

    @user3 = FactoryBot.create(:user, email: 'lonely@sql.er')
    @user3_token = FactoryBot.create(:login_token, user: @user3)
    @user3_key = @user3.crypto_key('asdfasdf')
    @user3_headers = {
      'Authorization' => @user3_token.token,
      'Crypto-Key' => @user3_key
    }
    @group.add_user(user: @user1, group_key: @group_crypto_key, is_admin: false)

  end
  after(:all) do
    @group.destroy!
    @user1.destroy!
    @user2.destroy!
  end
  describe '/api/sql_queries' do
    before(:each) do
      @q1 = sql_query('# USER 1 private query', config: { db_server: @private_db, user: @user1 })
      @q2 = sql_query('# USER 1 private favorite query', config: { db_server: @private_db, user: @user1, is_favorite: true })
      @q3 = sql_query(
        'USER 1 erroneous query',
        config: { 
          db_server: @private_db, 
          user: @user1, 
          is_valid: false,
           error: JSON.dump([{error: 'Command not found', query_index: 0}])
        }
      )

      @q4 = sql_query('# USER 2 private query', config: { db_server: @shared_db, user: @user2 })
      @q5 = sql_query('# USER 2 shared query', config: { db_server: @shared_db, user: @user2, is_private: false })
    end
    after(:each) do
      SqlQuery.all.destroy_all
    end
    describe 'GET' do
      it 'reports all executed queries of a user' do
        get(
          '/api/sql_queries',
          headers: @user1_headers
        )

        expect(response.successful?).to be_truthy
        expect(json.size).to be(3)
        expect(json[0]['query']).to eq('# USER 1 private favorite query')
        expect(json[1]['query']).to eq('USER 1 erroneous query')
        expect(json[2]['query']).to eq('# USER 1 private query')
      end
    end
    describe 'Querying adds queries' do
      describe 'single query' do
        it 'reports successful query execution' do
          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/query",
            headers: @user1_headers,
            params: {query: 'SELECT * FROM ninja_turtles'}
          )
          expect(response.successful?).to be_truthy
          expect(SqlQuery.all.size).to be(6)
          get(
            '/api/sql_queries',
            headers: @user1_headers
          )
          # favorites first (one record)
          expect(json[1]['query']).to eq('SELECT * FROM ninja_turtles')
          expect(json[1]['is_valid']).to be_truthy
        end
        it 'reports erroneous query execution, including the error' do
          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/query",
            headers: @user1_headers,
            params: {query: 'SELECT * FROM ninja_turtless'}
          )
          expect(response.successful?).to be_truthy
          expect(SqlQuery.all.size).to be(6)
          get(
            '/api/sql_queries',
            headers: @user1_headers
          )
          # favorites first (one record)
          expect(json[1]['query']).to eq('SELECT * FROM ninja_turtless')
          expect(json[1]['is_valid']).to be_falsey
          err = 'PG::UndefinedTable: ERROR:  relation "ninja_turtless" does not exist'
          expect(json[1]['error'][0]['error'].starts_with? err).to be_truthy
        end
      end

      describe 'multi query' do
        it 'reports successful query execution' do
          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/multi_query",
            headers: @user1_headers,
            params: {queries: ['SELECT * FROM ninja_turtles', 'SELECT * FROM fights']}
          )
          expect(response.successful?).to be_truthy
          expect(SqlQuery.all.size).to be(6)
          get(
            '/api/sql_queries',
            headers: @user1_headers
          )
          # favorites first (one record)
          expect(json[1]['query']).to eq("SELECT * FROM ninja_turtles;\nSELECT * FROM fights;")
          expect(json[1]['is_valid']).to be_truthy
        end
        it 'reports erroneous query execution, including the error' do
          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/multi_query",
            headers: @user1_headers,
            params: {
              queries: [
                'SELECT * FROM ninja_turtles',
                'SELECT * FROM fighters',
                'SELECT * FROM fights'
              ],
              proceed_after_error: true
            }
          )
          expect(response.successful?).to be_truthy
          expect(SqlQuery.all.size).to be(6)
          get(
            '/api/sql_queries',
            headers: @user1_headers
          )
          # favorites first (one record)
          expect(json[1]['query']).to eq("SELECT * FROM ninja_turtles;\nSELECT * FROM fighters;\nSELECT * FROM fights;")
          expect(json[1]['is_valid']).to be_falsey

          err = 'PG::UndefinedTable: ERROR:  relation "fighters" does not exist'
          expect(json[1]['error'][0]['error'].starts_with? err).to be_truthy
          expect(json[1]['error'][0]['query_index']).to be(1)
        end
      end


      describe 'raw query' do
        it 'reports successful query execution' do
          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/raw_query",
            headers: @user1_headers,
            params: {query: 'SELECT * FROM ninja_turtles; SELECT * FROM fights;'}
          )
          expect(response.successful?).to be_truthy
          expect(SqlQuery.all.size).to be(6)
          get(
            '/api/sql_queries',
            headers: @user1_headers
          )
          # favorites first (one record)
          expect(json[1]['query']).to eq("SELECT * FROM ninja_turtles; SELECT * FROM fights;")
          expect(json[1]['is_valid']).to be_truthy
        end
        it 'reports erroneous query execution, including the error' do
          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/raw_query",
            headers: @user1_headers,
            params: {
              query: <<-SQL
                SELECT * FROM ninja_turtles;
                SELECT * FROM fighters;
                SELECT * FROM fights;
              SQL
              
            }
          )
          expect(response.successful?).to be_truthy
          expect(SqlQuery.all.size).to be(6)
          get(
            '/api/sql_queries',
            headers: @user1_headers
          )
          # favorites first (one record)
          expect(json[1]['query'].strip).to eq(
            (<<-SQL
                SELECT * FROM ninja_turtles;
                SELECT * FROM fighters;
                SELECT * FROM fights;
              SQL
            ).strip
          )
          expect(json[1]['is_valid']).to be_falsey

          err = 'ERROR:  relation "fighters" does not exist'
          expect(json[1]['error'][0]['error'].starts_with? err).to be_truthy
          expect(json[1]['error'][0]['query_index']).to be(0)
        end
      end

      describe 'only the latest 100 queries per server and user are stored, favorites are kept' do
        it 'stores the moste recent 100 queries per server and user' do
          expect(@user1.sql_queries.size).to be(3)
          97.times do |n|
            post(
              "/api/db_servers/#{@private_db.id}/ninja_turtles_db/query",
              headers: @user1_headers,
              params: {query: "SELECT * FROM ninja_turtles LIMIT #{n + 4}"}
            )
            expect(response.successful?).to be_truthy
          end
          expect(@user1.sql_queries.size).to be(100)
          get('/api/sql_queries', headers: @user1_headers)
          expect(json[0]['query']).to eq('# USER 1 private favorite query')
          expect(json[1]['query']).to eq('SELECT * FROM ninja_turtles LIMIT 100')
          expect(json[99]['query']).to eq('# USER 1 private query')

          post(
            "/api/db_servers/#{@private_db.id}/ninja_turtles_db/query",
            headers: @user1_headers,
            params: {query: "SELECT * FROM ninja_turtles LIMIT 101"}
          )
          expect(response.successful?).to be_truthy
          expect(@user1.sql_queries.size).to be(100)
          get('/api/sql_queries', headers: @user1_headers)

          expect(json[0]['query']).to eq('# USER 1 private favorite query')
          expect(json[1]['query']).to eq('SELECT * FROM ninja_turtles LIMIT 101')
          expect(json[2]['query']).to eq('SELECT * FROM ninja_turtles LIMIT 100')
          expect(json[99]['query']).to eq('USER 1 erroneous query')


          post(
            "/api/db_servers/#{@shared_db.id}/ninja_turtles_db/query",
            headers: @user1_headers,
            params: {query: "SELECT * FROM ninja_turtles; # other server!"}
          )
          expect(response.successful?).to be_truthy
          expect(@user1.sql_queries.size).to be(101)
          get('/api/sql_queries', headers: @user1_headers)

          expect(json[0]['query']).to eq('# USER 1 private favorite query')
          expect(json[1]['query']).to eq('SELECT * FROM ninja_turtles; # other server!')
          expect(json[2]['query']).to eq('SELECT * FROM ninja_turtles LIMIT 101')
          expect(json[100]['query']).to eq('USER 1 erroneous query')
        end
      end
    end

    describe 'GET /shared' do
      it 'gets all shared queries for a given group' do
        get(
          '/api/sql_queries/shared',
          headers: @user1_headers,
          params: {
            group_id: @group.id
          }
        )

        expect(response.successful?).to be_truthy
        expect(json.size).to be(1)
        expect(json.first['query']).to eq('# USER 2 shared query')

      end
    end
    describe '/:id' do
      describe 'GET' do
        it 'lets the owner request it\'s query' do
          get(
            "/api/sql_queries/#{@q1.id}",
            headers: @user1_headers
          )
          expect(response.successful?).to be_truthy
          expect(json['query']).to eq('# USER 1 private query')
        end

        it 'prevents non owners to request a query' do
          get(
            "/api/sql_queries/#{@q1.id}",
            headers: @user2_headers
          )
          expect(response.successful?).to be_falsey
        end

        it 'lets group members request shared queries' do
          get(
            "/api/sql_queries/#{@q5.id}",
            headers: @user1_headers
          )
          expect(response.successful?).to be_truthy
          expect(json['query']).to eq('# USER 2 shared query')
        end

        it 'prevents non group members from requesting shared queries' do
          get(
            "/api/sql_queries/#{@q5.id}",
            headers: @user3_headers
          )
          expect(response.successful?).to be_falsey
        end
      end

      describe 'PUT' do
        it 'lets owners update query props' do
          expect(@q1.favorite?).to be_falsey
          put(
            "/api/sql_queries/#{@q1.id}",
            headers: @user1_headers,
            params: {
              data: {
                is_favorite: true
              }
            }
          )
          expect(response.successful?).to be_truthy
          @q1.reload
          expect(@q1.favorite?).to be_truthy
        end
        
        it 'prevents strangers from updating query props' do
          expect(@q1.favorite?).to be_falsey
          put(
            "/api/sql_queries/#{@q1.id}",
            headers: @user2_headers,
            params: {
              data: {
                is_favorite: true
              }
            }
          )
          expect(response.successful?).to be_falsey
          @q1.reload
          expect(@q1.favorite?).to be_falsey
        end

        it 'allows group admins to update query props' do
          # grant user1 admin permission
          u1 = @group.group_members.find_by(user_id: @user1.id)
          u1.update!(
            is_admin: true
          )
          put(
            "/api/sql_queries/#{@q5.id}",
            headers: @user1_headers,
            params: {
              data: {
                is_private: true
              }
            }
          )
          expect(response.successful?).to be_truthy
          @q5.reload
          expect(@q5.public?).to be_falsey
        end
      end

    end
  end

end
