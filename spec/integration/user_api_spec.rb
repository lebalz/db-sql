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

  describe 'GET /api/users/current' do
    it 'can get the current user' do
      get('/api/users/current', headers: @headers)
      expect(response.successful?).to be true

      expect(json).to eq(
        "id" => @user.id,
        "email" => @user.email,
        "updated_at" => @user.updated_at.iso8601,
        "created_at" => @user.created_at.iso8601,
        "crypto_key" => nil,
        "token" => nil,
        "role" => "user",
        "login_count" => @user.login_count,
        "activated" => @user.activated
      )
    end
  end

  describe 'DELETE /api/users/current' do
    it 'can delete the current user' do
      user = FactoryBot.create(:user)
      login_token = FactoryBot.create(:login_token, user: user)
      headers = {
        'Authorization' => login_token.token
      }
      delete(
        '/api/users/current',
        headers: headers,
        params: {
          password: 'asdfasdf'
        }
      )
      expect(response.successful?).to be true
      expect(User.exists?(user.id)).to be_falsey
    end
  end

  describe 'PUT /api/users/current/password' do
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

      put(
        '/api/users/current/password',
        headers: headers,
        params: params
      )
      expect(response.successful?).to be true
      user.reload
      expect(user.login_tokens.count).to eq(1)
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
        put(
          '/api/users/current/password',
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
        put(
          '/api/users/current/password',
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
        put(
          '/api/users/current/password',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(@user.authenticate('asdfasdf')).to be_truthy
      end
    end

  end
end
