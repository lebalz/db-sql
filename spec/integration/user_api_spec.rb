# frozen_string_literal: true
require_relative '../rails_helper.rb'

RSpec.describe "API::Resources::User" do
  before(:all) do
    @user = FactoryBot.create(:user)
    @login_token = FactoryBot.create(:login_token, user: @user)
    @crypto_key = @user.crypto_key('asdfasdf')
    @headers = {
      'Authorization' => @login_token.token,
      'Crypto-Key' => @crypto_key
    }
    FactoryBot.create(:db_connection, user: @user)
    FactoryBot.create(:db_connection, user: @user)
  end
  describe 'POST /api/user/validate' do
    let(:id) { @user.id }
    let(:email) { @user.email }
    let(:params) do
      {
        id: id,
        email: email
      }
    end
    it 'can validate a user' do
      post(
        "/api/user/validate",
        headers: @headers,
        params: params
      )
      expect(response.successful?).to be_truthy
      expect(json['email']).to eq(@user.email)
      expect(json['id']).to eq(@user.id)
      expect(json['login_count']).to eq(@user.login_count)
    end
    context 'email is not from token' do
      let(:email) { 'bla@bar.ch' }
      it 'returns 401' do
        post(
          "/api/user/validate",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(401)
      end
    end
    context 'id is not from token' do
      let(:id) { 'rand-whatever' }
      it 'returns 401' do
        post(
          "/api/user/validate",
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(401)
      end
    end
  end

  describe 'GET /api/user' do
    it 'can get the current user' do
      get('/api/user', headers: @headers)
      expect(response.successful?).to be true

      expect(json).to eq({
        "id" => @user.id,
        "email" => @user.email,
        "last_login" => @login_token.updated_at.iso8601,
        "updated_at" => @user.updated_at.iso8601,
        "created_at" => @user.created_at.iso8601,
        "crypto_key" => nil,
        "token" => nil,
        "login_count" => @user.login_count
      })
    end
  end

  describe 'POST /api/user/new_password' do
    let(:old_password) { 'asdfasdf' }
    let(:new_password) { 'superPW111' }
    let(:password_confirmation) { 'superPW111' }
    let(:params) do
      {
        old_password: old_password,
        new_password: new_password,
        password_confirmation: password_confirmation
      }
    end
    it 'can set a new password' do
      user = FactoryBot.create(:user)
      login_token = FactoryBot.create(:login_token, user: user)
      crypto_key = user.crypto_key('asdfasdf')
      headers = {
        'Authorization' => login_token.token,
        'Crypto-Key' => crypto_key
      }
      FactoryBot.create(:db_connection, user: user)
      FactoryBot.create(:db_connection, user: user)

      post(
        '/api/user/new_password',
        headers: headers,
        params: params
      )
      expect(response.successful?).to be true
      user.reload
      expect(user.login_tokens.count).to eq(1);
      expect(user.authenticate('asdfasdf')).to be false
      expect(user.authenticate('superPW111')).to be_truthy
      expect(json['token']).to eq(user.login_tokens.order(:updated_at).last.token)
      expect(user.login_tokens.order(:updated_at).last.token).not_to eq(headers['Authorization'])
      user.db_connections.each do |db_connection|
        expect(db_connection.password(json['crypto_key'])).to eq('safe-db-password')
      end
    end
    context 'not valid old password' do
      let(:old_password) { 'wrong' }
      it 'will not update password' do
        post(
          '/api/user/new_password',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(@user.authenticate('asdfasdf')).to be_truthy
      end
    end
    context 'not valid confirmation' do
      let(:password_confirmation) { 'wrong' }
      it 'will not update password' do
        post(
          '/api/user/new_password',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(@user.authenticate('asdfasdf')).to be_truthy
      end
    end
    context 'not valid new password with confirmation' do
      let(:new_password) { 'wrong' }
      it 'will not update password' do
        post(
          '/api/user/new_password',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(@user.authenticate('asdfasdf')).to be_truthy
      end
    end

  end
end
