# frozen_string_literal: true

require_relative '../rails_helper.rb'

RSpec.describe "API::Resources::DatabaseSchemaQuery" do
  before(:all) do

    @user1 = FactoryBot.create(:user)
    @user2 = FactoryBot.create(:user)
    @user3 = FactoryBot.create(:user)

    @user1_token = FactoryBot.create(:login_token, user: @user1)
    @user1_key = @user1.crypto_key('asdfasdf')
    @user1_headers = {
      'Authorization' => @user1_token.token,
      'Crypto-Key' => @user1_key
    }
    
    @user2_token = FactoryBot.create(:login_token, user: @user2)
    @user2_key = @user2.crypto_key('asdfasdf')
    @user2_headers = {
      'Authorization' => @user2_token.token,
      'Crypto-Key' => @user2_key
    }

    @user3_token = FactoryBot.create(:login_token, user: @user3)
    @user3_key = @user3.crypto_key('asdfasdf')
    @user3_headers = {
      'Authorization' => @user3_token.token,
      'Crypto-Key' => @user3_key
    }


    @group1 = FactoryBot.create(:group, name: 'Random SQL')
    @group2 = FactoryBot.create(:group, name: 'Fancy Pancy')
    @group3 = FactoryBot.create(:group, name: 'Public Shizzle', is_private: false)

    @group1_key = Group.random_crypto_key
    @group2_key = Group.random_crypto_key

    @group1.add_user(user: @user1, group_key: @group1_key, is_admin: true)
    @group1.add_user(user: @user2, group_key: @group1_key, is_admin: false)

    @group2.add_user(user: @user1, group_key: @group2_key, is_admin: false)
    @group2.add_user(user: @user3, group_key: @group2_key, is_admin: true)

    FactoryBot.create(
      :db_server,
      :group,
      name: 'db_server1',
      db_type: :psql,
      username: 'foobar',
      port: 5432,
      group: @group1
    )

    FactoryBot.create(
      :db_server,
      :group,
      name: 'db_server2',
      db_type: :mysql,
      username: 'chocolate',
      port: 5432,
      group: @group1
    )

    FactoryBot.create(
      :db_server,
      :group,
      name: 'db_server3',
      db_type: :psql,
      username: 'bliblablu',
      port: 5432,
      group: @group2
    )

  end
  describe 'GET /api/groups' do
    it 'returns all groups of a user' do
      get(
        "/api/groups",
        headers: @user1_headers
      )

      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)
      expect(json[0]["name"]).to eq("Random SQL")
      expect(json[0]["members"].find { |u| u['user_id'] == @user1.id }['is_admin']).to be_truthy

      db_servers = json[0]['db_servers'].sort_by { |h| h['name'] }      
      expect(db_servers.count).to be(2)
      expect(db_servers[0]['name']).to eq("db_server1")
      expect(db_servers[0]['username']).to eq("foobar")
      expect(db_servers[1]['name']).to eq("db_server2")
      expect(db_servers[1]['username']).to eq("chocolate")

      expect(json[1]["name"]).to eq("Fancy Pancy")
      expect(json[1]["db_servers"].count).to be(1)
      expect(json[1]["db_servers"][0]['name']).to eq("db_server3")
      expect(json[1]["db_servers"][0]['username']).to eq("bliblablu")
      expect(json[1]["members"]).to be_nil

      get(
        "/api/groups",
        headers: @user2_headers
      )
    
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json[0]["members"]).to be_nil
      expect(json[0]["name"]).to eq("Random SQL")

      db_servers = json[0]['db_servers'].sort_by { |h| h['name'] }      
      expect(db_servers.count).to be(2)
      expect(db_servers[0]['name']).to eq("db_server1")
      expect(db_servers[0]['username']).to eq("foobar")
      expect(db_servers[1]['name']).to eq("db_server2")
      expect(db_servers[1]['username']).to eq("chocolate")

      get(
        "/api/groups",
        headers: @user3_headers
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json[0]["name"]).to eq("Fancy Pancy")
      expect(json[0]["db_servers"].count).to be(1)
      expect(json[0]["db_servers"][0]['username']).to eq("bliblablu")
      expect(json[0]["db_servers"][0]['name']).to eq("db_server3")
      expect(json[0]["members"].find { |u| u['user_id'] == @user3.id }['is_admin']).to be_truthy
    end

    it 'returns all public available groups' do
      get(
        "/api/groups/public",
        headers: @user1_headers
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json.first['is_member']).to be_falsey
    end

    it 'returns count of the public available groups' do
      get(
        "/api/groups/counts"
      )
      # queries are ordered
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
    end
  end

  describe 'POST /api/groups' do
    it 'allows users to add new groups' do
      expect(@user1.groups.count).to be(2)
      post(
        "/api/groups",
        headers: @user1_headers,
        params: {
          name: 'test group',
          is_private: true
        }
      )
      @user1.reload
      expect(@user1.groups.count).to be(3)
    ensure
      Group.find_by(name: 'test group').destroy
    end
  end

  describe 'DELETE /api/groups/:id' do
    before(:each) do
      @temp_group = FactoryBot.create(:group, name: 'Random SQL')
      key = Group.random_crypto_key

      @temp_group.add_user(user: @user1, group_key: key, is_admin: true)
      @temp_group.add_user(user: @user2, group_key: key, is_admin: false)
      FactoryBot.create(
        :db_server,
        :group,
        db_type: :psql,
        username: 'foobar',
        port: 5432,
        group: @temp_group
      )
      @user1.reload
    end
    after(:each) do
      @temp_group.destroy
      @user1.reload
    end

    it 'allows admins to destroy groups' do
      expect(@user1.groups.count).to be(3)
      expect(@user1.all_db_servers.count).to be(4)
      delete(
        "/api/groups/#{@temp_group.id}",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
      @user1.reload
      expect(@user1.groups.count).to be(2)
      expect(@user2.groups.count).to be(1)
      expect(@user1.all_db_servers.count).to be(3)
    end

    it 'non admins can not destroy groups' do
      expect(@user1.all_db_servers.count).to be(4)
      expect(@user2.groups.count).to be(2)
      delete(
        "/api/groups/#{@temp_group.id}",
        headers: @user2_headers
      )
      expect(response.successful?).to be_falsey
      @user2.reload
      expect(@user1.groups.count).to be(3)
      expect(@user2.groups.count).to be(2)
      expect(@user1.all_db_servers.count).to be(4)
    end
  end

  describe 'PUT /api/groups/:id' do
    before(:each) do
      @temp_group = FactoryBot.create(:group, name: 'Random SQL')
      key = Group.random_crypto_key

      @temp_group.add_user(user: @user1, group_key: key, is_admin: true)
      @temp_group.add_user(user: @user2, group_key: key, is_admin: false)
      FactoryBot.create(
        :db_server,
        :group,
        db_type: :psql,
        username: 'foobar',
        port: 5432,
        group: @temp_group
      )
      @user1.reload
    end
    after(:each) do
      @temp_group.destroy
      @user1.reload
    end

    it 'allows admins to rename groups' do
      put(
        "/api/groups/#{@temp_group.id}",
        headers: @user1_headers,
        params: {
          data: {
            name: 'Guguseli'
          }
        }
      )
      expect(response.successful?).to be_truthy
      expect(json['name']).to eq('Guguseli')
      @temp_group.reload
      expect(@temp_group.name).to eq('Guguseli')
    end

    it 'non admins can not update groups' do
      put(
        "/api/groups/#{@temp_group.id}",
        headers: @user2_headers,
        params: {
          data: {
            name: 'Guguseli'
          }
        }
      )
      expect(response.successful?).to be_falsey
      @temp_group.reload
      expect(@temp_group.name).to eq('Random SQL')
    end
  end
end
