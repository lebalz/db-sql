# frozen_string_literal: true

require_relative '../rails_helper'

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
    @group3 = FactoryBot.create(:group, name: 'Public Shizzle',
                                        is_private: false)

    @group1_key = Group.random_crypto_key
    @group2_key = Group.random_crypto_key
    @group3_key = Group.random_crypto_key

    @group1.add_user(user: @user1, group_key: @group1_key, is_admin: true)
    @group1.add_user(user: @user2, group_key: @group1_key, is_admin: false)

    @group2.add_user(user: @user1, group_key: @group2_key, is_admin: false)
    @group2.add_user(user: @user3, group_key: @group2_key, is_admin: true)

    @group3.add_user(user: @user3, group_key: @group3_key, is_admin: true)

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

  describe 'GET /api/groups/:id' do

    before(:each) do
      user = FactoryBot.create(:user)

      @group1.reload
      expect(@group1.members.length).to be(2)

      post(
        "/api/groups/#{@group1.id}/members",
        headers: @user1_headers,
        params: {
          user_id: user.id
        }
      )
      @group1.reload
      expect(@group1.members.length).to be(3)
      expect(@group1.members.map(&:user_id)).to include(user.id)

      user.request_password_reset
      token = user.reset_password_token
      user.reset_password(
        reset_token: token,
        password: '12341234',
        password_confirmation: '12341234'
      )
      @group_user = user
    end

    after(:each) do
      @group_user&.destroy
      @group1.reload
    end

    it 'can get details of a joined group' do
      get(
        "/api/groups/#{@group1.id}",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
      expect(json['name']).to eq('Random SQL')
      expect(json['members'].size).to be(3)
      u1_user = json['members'].find { |u| u['user_id'] == @user1.id }
      expect(u1_user['is_admin']).to be_truthy
      expect(json['db_servers'].size).to be(2)
      expect(json['is_member']).to be_truthy
      expect(json['is_private']).to be_truthy

    end

    it 'updates outdated group members' do
      user = @group_user
      @group1.reload
      member = @group1.members.find { |m| m.user_id == user.id }
      expect(member.is_outdated).to be_truthy

      get(
        "/api/groups/#{@group1.id}",
        headers: @user2_headers
      )
      @group1.reload
      member = @group1.members.find { |m| m.user_id == user.id }
      expect(member.is_outdated).to be_falsey
    end

    it 'can not update itself' do
      user = @group_user
      user_token = FactoryBot.create(:login_token, user: user)
      user_key = user.crypto_key('12341234')
      user_headers = {
        'Authorization' => user_token.token,
        'Crypto-Key' => user_key
      }
      @group1.reload
      member = @group1.members.find { |m| m.user_id == user.id }
      expect(member.is_outdated).to be_truthy

      get(
        "/api/groups/#{@group1.id}",
        headers: user_headers
      )
      expect(response.successful?).to be_truthy
      @group1.reload
      member = @group1.members.find { |m| m.user_id == user.id }
      expect(member.is_outdated).to be_truthy

    end
  end

  describe 'GET /api/users/:id/groups' do
    it 'returns all groups of a user' do
      get(
        "/api/users/#{@user1.id}/groups",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)

      expect(json[0]["name"]).to eq("Fancy Pancy")
      expect(json[0]["db_servers"].count).to be(1)
      expect(json[0]["db_servers"][0]['name']).to eq("db_server3")
      expect(json[0]["db_servers"][0]['username']).to eq("bliblablu")
      expect(json[0]["members"]).to be_nil


      expect(json[1]["name"]).to eq("Random SQL")
      expect(json[1]["members"].find do |u|
               u['user_id'] == @user1.id
             end             ['is_admin']).to be_truthy

      db_servers = json[1]['db_servers'].sort_by { |h| h['name'] }
      expect(db_servers.count).to be(2)
      expect(db_servers[0]['name']).to eq("db_server1")
      expect(db_servers[0]['username']).to eq("foobar")
      expect(db_servers[1]['name']).to eq("db_server2")
      expect(db_servers[1]['username']).to eq("chocolate")

      get(
        "/api/users/#{@user2.id}/groups",
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
        "/api/users/#{@user3.id}/groups",
        headers: @user3_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(2)

      expect(json[0]["name"]).to eq("Fancy Pancy")
      expect(json[0]["db_servers"].count).to be(1)
      expect(json[0]["db_servers"][0]['username']).to eq("bliblablu")
      expect(json[0]["db_servers"][0]['name']).to eq("db_server3")
      u3member = json[0]["members"].find do |u|
        u['user_id'] == @user3.id
      end
      expect(u3member['is_admin']).to be_truthy

      expect(json[1]["name"]).to eq("Public Shizzle")
    end

  end

  describe 'GET /api/groups/public/count' do
    it 'returns count of the public available groups' do
      get(
        "/api/groups/public/counts"
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

    it 'allows owners to destroy groups' do
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

    it 'non owners can not destroy groups' do
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

  describe 'POST /api/groups/:id/generate_new_crypto_key' do
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
        db_password: 'bliblablu',
        port: 5432,
        group: @temp_group
      )
      @user1.reload
    end
    after(:each) do
      @temp_group.destroy
      @user1.reload
    end

    it 'allows group admins to recrypt' do
      post(
        "/api/groups/#{@temp_group.id}/generate_new_crypto_key",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
    end

    it 'prevents non group admins to recrypt' do
      post(
        "/api/groups/#{@temp_group.id}/generate_new_crypto_key",
        headers: @user2_headers
      )
      expect(response.successful?).to be_falsey
    end

    it 'recryption resets all db server passwords' do
      crypto_key=@temp_group.crypto_key(@user1, @user1.private_key(@user1_key))
      expect(@temp_group.db_servers.first.password(crypto_key)).to eq('bliblablu')
      post(
        "/api/groups/#{@temp_group.id}/generate_new_crypto_key",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
      @temp_group.reload
      crypto_key=@temp_group.crypto_key(@user1, @user1.private_key(@user1_key))
      expect(@temp_group.db_servers.first.password(crypto_key)).to eq('-')
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

  describe 'PATCH /api/groups/:id/join' do
    after(:each) do
      @group3.users.each do |user|
        @group3.remove_user(user: user) unless @group3.admin? user
      end
      @group3.reload
      expect(@group3.users.size).to be(1)
    end
    it 'can join public groups' do
      expect(@group3.public?).to be_truthy
      expect(@group3.members.size).to be(1)
      patch(
        "/api/groups/#{@group3.id}/join",
        headers: @user1_headers
      )

      expect(response.successful?).to be_truthy
      @group3.reload
      expect(@group3.members.size).to be(2)
    end

    it 'can not join private groups' do
      expect(@group1.private?).to be_truthy
      expect(@group1.members.size).to be(2)
      patch(
        "/api/groups/#{@group1.id}/join",
        headers: @user3_headers
      )
      expect(response.successful?).to be_falsey
      @group1.reload
      expect(@group1.members.size).to be(2)
    end
  end

  describe 'PATCH /api/groups/:id/leave' do
    before(:each) do
      patch(
        "/api/groups/#{@group3.id}/join",
        headers: @user1_headers
      )
      @group3.reload
      expect(@group3.users.size).to be(2)
      expect(@group3.member?(@user1)).to be_truthy
    end
    after(:each) do
      @group3.users.each do |user|
        @group3.remove_user(user: user)  unless @group3.admin? user
      end
      @group3.reload
      expect(@group3.users.size).to be(1)
    end

    it 'can leave public groups' do
      expect(@group3.member?(@user1)).to be_truthy
      patch(
        "/api/groups/#{@group3.id}/leave",
        headers: @user1_headers
      )

      expect(response.successful?).to be_truthy
      expect(@group3.member?(@user1)).to be_falsey
    end

    it 'can not leave private groups' do
      expect(@group1.private?).to be_truthy
      expect(@group1.member?(@user1)).to be_truthy
      patch(
        "/api/groups/#{@group1.id}/leave",
        headers: @user1_headers
      )
      expect(response.successful?).to be_falsey
      @group1.reload
      expect(@group1.member?(@user1)).to be_truthy
    end

  end

  describe 'GET /api/group/public' do
    before(:each) do
      @group3.users.each do |user|
        @group3.remove_user(user: user) unless @group3.admin? user
      end
      expect(@group3.users.size).to be(1)
    end

    it 'returns all public groups, exluding joined groups' do
      get(
        "/api/groups/public",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(1)
      expect(json[0]['is_private']).to be_falsey
      expect(json[0]['is_member']).to be_falsey
      expect(json[0]['members']).to be_nil

      # now join this group
      patch(
        "/api/groups/#{@group3.id}/join",
        headers: @user1_headers
      )

      expect(response.successful?).to be_truthy

      # no unjoined public groups available
      get(
        "/api/groups/public",
        headers: @user1_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be(0)
    end

  end
end
