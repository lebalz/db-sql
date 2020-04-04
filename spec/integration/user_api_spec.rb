# frozen_string_literal: true

require_relative '../rails_helper'
require_relative './helpers'

RSpec.configure do |c|
  c.include Helpers
end

RSpec.describe "API::Resources::User" do
  before(:all) do
    @user = FactoryBot.create(:user)
    @login_token = FactoryBot.create(:login_token, user: @user)
    @crypto_key = @user.crypto_key('asdfasdf')
    @headers = {
      'Authorization' => @login_token.token,
      'Crypto-Key' => @crypto_key
    }
    FactoryBot.create(:db_server, user: @user)
    FactoryBot.create(:db_server, user: @user)
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
        "password_reset_requested" => false,
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
      FactoryBot.create(:db_server, user: user)
      FactoryBot.create(:db_server, user: user)

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
      user.db_servers.each do |db_server|
        expect(db_server.password(json['crypto_key'])).to eq('safe-db-password')
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

  describe 'POST /api/users' do
    let(:email) { 'new@user.ch' }
    let(:password) { 'foobarpw' }
    let(:params) do
      {
        email: email,
        password: password
      }
    end

    it 'can create new user' do
      post(
        '/api/users',
        headers: @headers,
        params: params
      )
      expect(response.successful?).to be true
      expect(json['email']).to eq(email)
      user = User.find_by(email: email)
      expect(user.login_tokens.size).to be(1)
      expect(user.activated?).to be_falsey
      login_token = LoginToken.find_by(token: json['token'])
      expect(login_token).to eq(user.login_tokens.first)
    end

    context 'invalid email' do
      let(:email) { 'notvalid(at).ch' }
      it 'it returns 400 when email is invalid' do
        post(
          '/api/users',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(400)
        expect(json['email'][0]).to eq('is invalid')
      end
    end
    context 'short password' do
      let(:password) { 'seven77' }
      it 'it returns 400 when password is too short' do
        post(
          '/api/users',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(400)
        expect(json['password'][0]).to eq('is too short (minimum is 8 characters)')
      end
    end
    context 'long password' do
      let(:password) { (['72char'] * 12).join }
      it 'it returns 201' do
        post(
          '/api/users',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_truthy
        expect(response.status).to be(201)
      end
    end
    context 'too long password' do
      let(:password) { (['72char'] * 12).join + '1' }
      it 'it returns 400 when password is too long' do
        post(
          '/api/users',
          headers: @headers,
          params: params
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(400)
        expect(json['password'][0]).to eq('is too long (maximum is 72 characters)')
      end
    end
  end

  describe 'PUT /api/users/:id/activate' do
    let(:email) { 'new@user.ch' }
    let(:password) { 'foobarpw' }
    let(:params) do
      {
        email: email,
        password: password
      }
    end

    it 'can activate new user' do
      post(
        '/api/users',
        headers: @headers,
        params: params
      )
      expect(response.successful?).to be true
      user = User.find_by(email: email)
      expect(user.activated?).to be_falsey

      put(api_activation_link)
      expect(response.successful?).to be_truthy
      user.reload
      expect(user.activated?).to be_truthy

      put(api_activation_link)
      expect(response.successful?).to be_truthy
      expect(response.status).to be(204)
    end
  end

  describe 'POST /api/users/current/resend_activation_link' do
    let(:user) { FactoryBot.create(:user, activated: false, activated_at: nil) }
    let(:token) { FactoryBot.create(:login_token, user: user).token }
    let(:headers) { { 'Authorization' => token } }
    it 'can resend activation link' do
      count = mail_count
      post(
        '/api/users/current/resend_activation_link',
        headers: headers
      )
      expect(response.successful?).to be_truthy
      expect(mail_count).to be(count + 1)
    end

    it 'only the last sent activation link can be used to activate' do
      post(
        '/api/users/current/resend_activation_link',
        headers: headers
      )
      expect(response.successful?).to be_truthy
      activation1 = api_activation_link
      post(
        '/api/users/current/resend_activation_link',
        headers: headers
      )
      activation2 = api_activation_link
      put(activation1)
      expect(response.successful?).to be_falsey
      user.reload
      expect(user.activated?).to be_falsey

      put(activation2)
      expect(response.successful?).to be_truthy
      user.reload
      expect(user.activated?).to be_truthy
    end
  end

  describe 'POST /api/users/reset_password' do
    it 'can reset password' do
      count = mail_count
      post(
        "/api/users/reset_password",
        params: { email: @user.email }
      )
      expect(response.successful?).to be true
      expect(mail_count).to be(count + 1)
      @user.reload
      # password did not yet change nor is the account deactivated
      expect(@user.authenticate('asdfasdf')).to be_truthy
    end
  end
  describe 'POST /api/users/:id/reset_password' do
    it 'can reset password' do
      post(
        "/api/users/reset_password",
        params: { email: @user.email }
      )
      expect(response.successful?).to be true
      expect(api_reset_password_link).to include('?reset_token=')
      post(
        api_reset_password_link,
        params: {
          password: '12341234',
          password_confirmation: '12341234'
        }
      )
      expect(response.successful?).to be_truthy
      @user.reload
      expect(@user.authenticate('12341234')).to be_truthy
    end

    it 'a reset link can be used only once reset password' do
      post(
        "/api/users/reset_password",
        params: { email: @user.email }
      )
      expect(response.successful?).to be true
      post(
        api_reset_password_link,
        params: {
          password: '12341234',
          password_confirmation: '12341234'
        }
      )
      expect(response.successful?).to be_truthy
      post(
        api_reset_password_link,
        params: {
          password: 'attackers_pw',
          password_confirmation: 'attackers_pw'
        }
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(400)
    end

    it 'only the last sent mail contains valid reset link' do
      post(
        "/api/users/reset_password",
        params: { email: @user.email }
      )
      expect(response.successful?).to be true
      reset_link1 = api_reset_password_link
      post(
        "/api/users/reset_password",
        params: { email: @user.email }
      )
      expect(response.successful?).to be true
      reset_link2 = api_reset_password_link

      post(
        reset_link1,
        params: {
          password: '12341234',
          password_confirmation: '12341234'
        }
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(400)
      post(
        reset_link2,
        params: {
          password: '12341234',
          password_confirmation: '12341234'
        }
      )
      expect(response.successful?).to be_truthy
      expect(response.status).to be(204)
    end
  end
end
