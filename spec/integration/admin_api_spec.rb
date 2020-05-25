# frozen_string_literal: true

require_relative '../rails_helper.rb'

RSpec.describe "API::Resources::Admin" do
  before(:all) do
    @admin = FactoryBot.create(:user, :admin)
    @login_token = FactoryBot.create(:login_token, user: @admin)
    @crypto_key = @admin.crypto_key('asdfasdf')
    @admin_headers = {
      'Authorization' => @login_token.token,
      'Crypto-Key' => @crypto_key
    }

    @user = FactoryBot.create(:user)
    @user_login_token = FactoryBot.create(:login_token, user: @user)
    @user_crypto_key = @user.crypto_key('asdfasdf')
    @user_headers = {
      'Authorization' => @user_login_token.token,
      'Crypto-Key' => @user_crypto_key
    }
  end
  describe 'GET /api/admin/users' do
    let(:request_headers) { @admin_headers }
    it 'can get all users' do
      get(
        "/api/admin/users",
        headers: request_headers
      )
      expect(response.successful?).to be_truthy
      expect(json.size).to be >= 2
      ids = json.map { |user| user['id'] }.sort
      expect(ids).to include(@admin.id, @user.id)
    end
    context 'user is not admin' do
      let(:request_headers) { @user_headers }
      it 'returns 403' do
        get(
          "/api/admin/users",
          headers: request_headers
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(403)
      end
    end
  end

  describe 'PUT /api/admin/users/:id' do
    let(:request_headers) { @admin_headers }
    it 'can update user role' do
      user = FactoryBot.create(:user)
      expect(user.admin?).to be_falsey
      put(
        "/api/admin/users/#{user.id}",
        headers: request_headers,
        params: {
          data: {
            role: 'admin'
          }
        }
      )
      expect(response.successful?).to be_truthy
      user.reload
      expect(user.admin?).to be_truthy
      user.destroy
    end
    it 'can not update users email' do
      user = FactoryBot.create(:user)
      expect(user.admin?).to be_falsey
      put(
        "/api/admin/users/#{user.id}",
        headers: request_headers,
        params: {
          data: {
            email: 'no@wonder.us'
          }
        }
      )
      expect(response.successful?).to be_truthy
      user.reload
      expect(user.email).not_to eq('no@wonder.us')
      user.destroy
    end
    context 'user is not admin' do
      let(:request_headers) { @user_headers }
      it 'returns 403' do
        put(
          "/api/admin/users/#{@user.id}",
          headers: request_headers,
          params: {
            data: {
              role: 'admin'
            }
          }
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(403)
        @user.reload
        expect(@user.admin?).to be_falsey
      end
    end
  end

  describe 'GET /api/admin/users/:id' do
    let(:request_headers) { @admin_headers }
    it 'can get a user' do
      user = FactoryBot.create(:user)
      get(
        "/api/admin/users/#{user.id}",
        headers: request_headers
      )
      expect(response.successful?).to be_truthy
      expect(json['email']).to eq(user.email)
    end
    it 'returns 404' do
      get(
        "/api/admin/users/eifach-es-textli",
        headers: request_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(404)
    end
    context 'user is not admin' do
      let(:request_headers) { @user_headers }
      it 'returns 403' do
        get(
          "/api/admin/users/#{@user.id}",
          headers: request_headers
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(403)
      end
    end
  end

  describe 'DELETE /api/admin/users/:id' do
    let(:request_headers) { @admin_headers }
    it 'can delete user' do
      user = FactoryBot.create(:user)
      delete(
        "/api/admin/users/#{user.id}",
        headers: request_headers
      )
      expect(response.successful?).to be_truthy
      expect(User.exists?(user.id)).to be_falsey
    end
    it 'returns 404 when user does not exist' do
      delete(
        "/api/admin/users/irgend-e-id-wo-ueberhoupt-kei-sinn-ergit",
        headers: request_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(404)
    end
    it 'can not delete self' do
      delete(
        "/api/admin/users/#{@admin.id}",
        headers: request_headers
      )
      expect(response.successful?).to be_falsey
      expect(response.status).to be(403)
      expect(@admin.persisted?).to be_truthy
    end
    context 'user is not admin' do
      let(:request_headers) { @user_headers }
      it 'returns 403' do
        delete(
          "/api/admin/users/#{@admin.id}",
          headers: request_headers
        )
        expect(response.successful?).to be_falsey
        expect(response.status).to be(403)
      end
    end
  end
end
