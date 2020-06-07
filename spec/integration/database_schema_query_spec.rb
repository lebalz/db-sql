# frozen_string_literal: true

require_relative '../rails_helper.rb'

RSpec.describe "API::Resources::DatabaseSchemaQuery" do
  before(:all) do
    @admin = FactoryBot.create(:user, :admin)
    @login_token = FactoryBot.create(:login_token, user: @admin)
    @crypto_key = @admin.crypto_key('asdfasdf')
    @admin_headers = {
      'Authorization' => @login_token.token,
      'Crypto-Key' => @crypto_key
    }

    @user_a = FactoryBot.create(:user)
    @user_a_login_token = FactoryBot.create(:login_token, user: @user_a)
    @user_a_crypto_key = @user_a.crypto_key('asdfasdf')
    @user_a_headers = {
      'Authorization' => @user_a_login_token.token,
      'Crypto-Key' => @user_a_crypto_key
    }

    @default_psql = DatabaseSchemaQuery.default(:psql)

    @user_b = FactoryBot.create(:user)
    @user_b_login_token = FactoryBot.create(:login_token, user: @user_b)
    @user_b_crypto_key = @user_b.crypto_key('asdfasdf')
    @user_b_headers = {
      'Authorization' => @user_b_login_token.token,
      'Crypto-Key' => @user_b_crypto_key
    }

    @q1 = FactoryBot.create(
      :database_schema_query,
      author: @user_a,
      query: 'SELECT FOO FROM BAR;',
      name: 'Q1',
      updated_at: Time.now - 1.day
    )
    @q1_private = FactoryBot.create(
      :database_schema_query,
      author: @user_a,
      query: 'SELECT private FROM BAR;',
      name: 'Q1 private',
      is_private: true,
      updated_at: Time.now
    )
    @q2 = FactoryBot.create(
      :database_schema_query,
      author: @user_b,
      query: 'SELECT FOO FROM BAR;',
      name: 'Q2',
      updated_at: Time.now - 1.hours
    )
    @q3_private = FactoryBot.create(
      :database_schema_query,
      author: @admin,
      query: 'SELECT private FROM BAR;',
      name: 'Q3 private',
      is_private: true,
      updated_at: Time.now
    )
  end
  describe 'GET /api/database_schema_queries' do
    it 'returns all schema queries accessible by this user' do
      get(
        "/api/database_schema_queries",
        headers: @user_a_headers
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(6)
      # first default queries
      expect(json[0]["name"]).to eq("mariadb")
      expect(json[1]["name"]).to eq("psql")
      expect(json[2]["name"]).to eq("mysql")
      # then the own queries, ordered by update_at DESC
      expect(json[3]["name"]).to eq("Q1 private")
      expect(json[4]["name"]).to eq("Q1")
      # and finally public queries
      expect(json[5]["name"]).to eq("Q2")

      # user_b can not see private queries from other users
      get(
        "/api/database_schema_queries",
        headers: @user_b_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(5)
      # first default queries
      expect(json[0]["name"]).to eq("mariadb")
      expect(json[1]["name"]).to eq("psql")
      expect(json[2]["name"]).to eq("mysql")
      # then the own queries
      expect(json[3]["name"]).to eq("Q2")
      # and finally public queries
      expect(json[4]["name"]).to eq("Q1")
    end

    it 'returns schema queries for mysql' do
      get(
        "/api/database_schema_queries?db_type=mysql",
        headers: @user_a_headers
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      # first default queries
      expect(json[0]["name"]).to eq("mysql")
    end
    it 'returns schema queries for mariadb' do
      get(
        "/api/database_schema_queries?db_type=mariadb",
        headers: @user_a_headers
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      # first default queries
      expect(json[0]["name"]).to eq("mariadb")
    end
    it 'returns schema queries for psql' do
      get(
        "/api/database_schema_queries?db_type=psql",
        headers: @user_a_headers
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(4)
      # first default queries
      expect(json[0]["name"]).to eq("psql")
      # then own queries
      expect(json[1]["name"]).to eq("Q1 private")
      expect(json[2]["name"]).to eq("Q1")
      # and finally public queries
      expect(json[3]["name"]).to eq("Q2")
    end

    it 'returns queries with limit and offset' do
      get(
        "/api/database_schema_queries?db_type=psql&offset=1&limit=2",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]["name"]).to eq("Q1 private")
      expect(json[1]["name"]).to eq("Q1")

      get(
        "/api/database_schema_queries?db_type=psql&offset=0&limit=2",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]["name"]).to eq("psql")
      expect(json[1]["name"]).to eq("Q1 private")

      get(
        "/api/database_schema_queries?db_type=psql&offset=1&limit=100",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(3)
      expect(json[0]["name"]).to eq("Q1 private")
      expect(json[1]["name"]).to eq("Q1")
      expect(json[2]["name"]).to eq("Q2")
    end
  end

  describe 'POST /api/database_schema_queries' do
    it 'can create a new database schema query' do
      post(
        "/api/database_schema_queries",
        headers: @user_a_headers,
        params: {
          name: 'Specki',
          db_type: 'mariadb',
          query: "SELECT 'i love speck'"
        }
      )
      expect(response.successful?).to be_truthy
      expect(json["name"]).to eq("Specki")
      expect(json["db_type"]).to eq("mariadb")
      expect(json["query"]).to eq("SELECT 'i love speck'")
      expect(json["description"]).to be_nil
      expect(json["is_private"]).to be_falsey
    end
    it 'can create a new database schema query with a description' do
      post(
        "/api/database_schema_queries",
        headers: @user_a_headers,
        params: {
          name: 'Specki',
          description: 'Gammis speck',
          db_type: 'mariadb',
          query: "SELECT 'i love speck'"
        }
      )
      expect(response.successful?).to be_truthy
      expect(json["name"]).to eq("Specki")
      expect(json["db_type"]).to eq("mariadb")
      expect(json["query"]).to eq("SELECT 'i love speck'")
      expect(json["description"]).to eq("Gammis speck")
      expect(json["is_private"]).to be_falsey
    end

    it 'can create a private database schema query' do
      post(
        "/api/database_schema_queries",
        headers: @user_a_headers,
        params: {
          name: 'Specki',
          db_type: 'mariadb',
          is_private: true,
          query: "SELECT 'i love speck'"
        }
      )
      expect(response.successful?).to be_truthy
      expect(json["name"]).to eq("Specki")
      expect(json["db_type"]).to eq("mariadb")
      expect(json["query"]).to eq("SELECT 'i love speck'")
      expect(json["description"]).to be_nil
      expect(json["is_private"]).to be_truthy
    end
  end

  describe 'GET /api/database_schema_queries/default' do
    it 'returns all default schema queries' do
      get(
        "/api/database_schema_queries/default",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(3)
      expect(json[0]["name"]).to eq("psql")
      expect(json[1]["name"]).to eq("mysql")
      expect(json[2]["name"]).to eq("mariadb")
    end
  end

  describe 'GET /api/database_schema_queries/counts' do
    it 'returns counts of available schema queries' do
      get(
        "/api/database_schema_queries/counts",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(json["psql"]).to be(4)
      expect(json["mysql"]).to be(1)
      expect(json["mariadb"]).to be(1)

      get(
        "/api/database_schema_queries/counts",
        headers: @user_b_headers
      )
      expect(response.successful?).to be_truthy
      expect(json["psql"]).to be(3)
      expect(json["mysql"]).to be(1)
      expect(json["mariadb"]).to be(1)
    end
  end

  describe 'GET /api/database_schema_queries/{id}/make_default' do
    it 'normal user can not make queries default' do
      expect(DatabaseSchemaQuery.default(:psql).id).to eq(@default_psql.id)
      post(
        "/api/database_schema_queries/#{@q1.id}/make_default",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(401)
      expect(DatabaseSchemaQuery.default(:psql).id).to eq(@default_psql.id)
    end

    it 'admin user can make public queries default' do
      expect(DatabaseSchemaQuery.default(:psql).id).to eq(@default_psql.id)
      post(
        "/api/database_schema_queries/#{@q1.id}/make_default",
        headers: @admin_headers
      )
      expect(response.successful?).to be_truthy
      expect(DatabaseSchemaQuery.default(:psql).id).to eq(@q1.id)
    ensure
      @default_psql.make_default!
    end

    it 'admin user can not make private queries default' do
      expect(DatabaseSchemaQuery.default(:psql).id).to eq(@default_psql.id)
      post(
        "/api/database_schema_queries/#{@q3_private.id}/make_default",
        headers: @admin_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(403)
      expect(DatabaseSchemaQuery.default(:psql).id).to eq(@default_psql.id)
    ensure
      @default_psql.make_default!
    end
  end

  describe 'GET /api/database_schema_queries/{id}' do
    it 'can get authored queries' do
      get(
        "/api/database_schema_queries/#{@q1.id}",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(json["id"]).to eq(@q1.id)
    end

    it 'can get public queries from other authors' do
      get(
        "/api/database_schema_queries/#{@q1.id}",
        headers: @user_b_headers
      )
      expect(response.successful?).to be_truthy
      expect(json["id"]).to eq(@q1.id)
    end

    it 'is forbidden to retrieve private queries from other authors' do
      get(
        "/api/database_schema_queries/#{@q1_private.id}",
        headers: @user_b_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to eq(401)
    end
  end

  describe 'PUT /api/database_schema_queries/{id}' do
    it 'can update authored queries' do
      expect(@q1.description).to be_nil
      put(
        "/api/database_schema_queries/#{@q1.id}",
        headers: @user_a_headers,
        params: {
          data: {
            description: 'A better foobar circus'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json["id"]).to eq(@q1.id)
      expect(json['description']).to eq('A better foobar circus')
      @q1.reload
      expect(@q1.description).to eq('A better foobar circus')
    ensure
      @q1.update!(description: nil)
    end

    it 'is forbidden to update a query from another author' do
      expect(@q1.description).to be_nil
      put(
        "/api/database_schema_queries/#{@q1.id}",
        headers: @user_b_headers,
        params: {
          data: {
            description: 'A better foobar circus'
          }
        }
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to eq(401)
      expect(@q1.description).to be_nil
    end
  end

  describe 'DELETE /api/database_schema_queries/{id}' do
    it 'is allowed to delete authored, private queries' do
      q = FactoryBot.create(
        :database_schema_query,
        author: @user_a,
        query: 'SELECT FOO FROM BAR;',
        name: 'Q1',
        is_private: true
      )
      expect(q.persisted?).to be_truthy
      delete(
        "/api/database_schema_queries/#{q.id}",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(response.status).to eq(204)
      expect(DatabaseSchemaQuery.find_by(id: q.id)).to be_nil
    ensure
      q.destroy!
    end

    it 'is allowed to delete authored, public queries if they are not referenced' do
      q = FactoryBot.create(
        :database_schema_query,
        author: @user_a,
        query: 'SELECT FOO FROM BAR;',
        name: 'Q1'
      )
      expect(q.persisted?).to be_truthy
      delete(
        "/api/database_schema_queries/#{q.id}",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_truthy
      expect(response.status).to eq(204)
      expect(DatabaseSchemaQuery.find_by(id: q.id)).to be_nil
    ensure
      q.destroy!
    end

    it 'is forbidden to delete referenced (=used) queries' do
      q = FactoryBot.create(
        :database_schema_query,
        author: @user_a,
        query: 'SELECT FOO FROM BAR;',
        name: 'Q1'
      )
      db = FactoryBot.create(
        :db_server,
        user: @user_a,
        database_schema_query: q
      )
      expect(q.persisted?).to be_truthy
      delete(
        "/api/database_schema_queries/#{q.id}",
        headers: @user_a_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to eq(403)
      expect(DatabaseSchemaQuery.find_by(id: q.id)).not_to be_nil
    ensure
      db.destroy!
      q.destroy!
    end

    it 'is forbidden to delete a query from another user' do
      q = FactoryBot.create(
        :database_schema_query,
        author: @user_a,
        query: 'SELECT FOO FROM BAR;',
        name: 'Q1'
      )
      expect(q.persisted?).to be_truthy
      delete(
        "/api/database_schema_queries/#{q.id}",
        headers: @user_b_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to eq(401)
      expect(DatabaseSchemaQuery.find_by(id: q.id)).not_to be_nil
    ensure
      q.destroy!
    end
  end
end
