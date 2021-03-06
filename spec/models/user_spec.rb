# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                          :uuid             not null, primary key
#  activated_at                :datetime
#  activation_digest           :string
#  email                       :string
#  login_count                 :integer          default(0)
#  password_digest             :string
#  private_key_pem             :string
#  public_key_pem              :string
#  reset_password_digest       :string
#  reset_password_mail_sent_at :datetime
#  role                        :integer          default("user")
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#
# Indexes
#
#  index_users_on_email  (email) UNIQUE
#

require_relative '../rails_helper'

RSpec.describe DbServer, type: :model do
  describe 'db connection' do
    it 'can create a valid user' do
      user = User.new(
        email: 'foo@bar.ch',
        password: 'irgendöppis'
      )
      expect(user.valid?).to be_truthy
    end

    it 'validates presence of #email' do
      user = User.new
      error_msg = "can't be blank"
      expect(user.valid?).to be_falsy
      expect(user.errors[:email]).to include(error_msg)
      user.email = 'foo@bar.ch'
      user.valid?
      expect(user.errors[:email]).to_not include(error_msg)
    end

    it 'validates uniqueness of #email' do
      FactoryBot.create(:user)
      user = User.new(email: User.last.email)
      error_msg = "has already been taken"
      expect(user.valid?).to be_falsy
      expect(user.errors[:email]).to include(error_msg)
      user.email = "foo@bar.ch"
      user.valid?
      expect(user.errors[:email]).to_not include(error_msg)
    end

    it 'validates presence of #password' do
      user = User.new
      error_msg = "can't be blank"
      expect(user.valid?).to be_falsy
      expect(user.errors[:password]).to include(error_msg)
      user.password = "irgendöppis"
      user.valid?
      expect(user.errors[:password]).to_not include(error_msg)
    end

    it 'validates length of #password' do
      user = User.new(password: 'tooShrt')
      error_msg = "is too short (minimum is 8 characters)"
      expect(user.valid?).to be_falsy
      expect(user.errors[:password]).to include(error_msg)
    end

    it 'returns unique crypto key' do
      user1 = FactoryBot.create(:user)
      user2 = FactoryBot.create(:user)
      expect(user1.crypto_key('foobar')).not_to eq(user2.crypto_key('foobar'))
    end

    it 'can update password' do
      user = FactoryBot.create(:user, password: 'unsafe_pw')

      connection1 = FactoryBot.create(
        :db_server,
        db_password: 'foobar',
        user_password: 'unsafe_pw',
        user: user
      )
      connection2 = FactoryBot.create(
        :db_server,
        db_password: 'blabla',
        user_password: 'unsafe_pw',
        user: user
      )

      expect(user.db_servers.size).to be(2)
      user.change_password!(
        old_password: 'unsafe_pw',
        new_password: 'safe_password',
        password_confirmation: 'safe_password'
      )

      db_servers = user.db_servers
      expect(db_servers.size).to be(2)
      connection1.reload
      expect(connection1.password(user.crypto_key('safe_password'))).to eq('foobar')
      connection2.reload
      expect(connection2.password(user.crypto_key('safe_password'))).to eq('blabla')
    end

    it 'returns correct validation status' do
      user = FactoryBot.create(:user, :unactivated)
      token = user.activation_token
      expect(user.activated?).to be_falsy
      user.activate(token)
      expect(user.activated?).to be_truthy
    end
  end
end
