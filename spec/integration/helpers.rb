# frozen_string_literal: true

module Helpers

  def mail_content
    activation_mail = ActionMailer::Base.deliveries.last
    Nokogiri::HTML(activation_mail.body.raw_source)
  end

  def mail_count
    ActionMailer::Base.deliveries.count
  end

  def activation_link
    mail_content.at_css('#activation-link')[:href]
  end

  def api_activation_link
    link = activation_link
    api_part = link[link.index('/users/')..-1]
    "/api#{api_part}"
  end

  def reset_password_link
    mail_content.at_css('#reset-link')[:href]
  end

  def api_reset_password_link
    link = reset_password_link
    api_part = link[link.index('/users/')..-1]
    "/api#{api_part}"
  end

  DATABSE_CONFIGS = [
    { db_type: :psql, username: 'postgres', port: 5009, version: 'p9.3' },
    { db_type: :psql, username: 'postgres', port: 5010, version: 'p10' },
    { db_type: :psql, username: 'postgres', port: 5011, version: 'p11' },
    { db_type: :psql, username: 'postgres', port: 5012, version: 'p12' },
    { db_type: :mysql, username: 'root', port: 3356, version: 'm5.6' },
    { db_type: :mysql, username: 'root', port: 3357, version: 'm5.7' },
    { db_type: :mysql, username: 'root', port: 3380, version: 'm8' }
  ].freeze

  def db_server_for(version)
    config = DATABSE_CONFIGS.find { |conf| conf[:version] == version }
    FactoryBot.create(
      :db_server,
      db_type: config[:db_type],
      username: config[:username],
      port: config[:port]
    )
  end

  def config_for(db_version:)
    @db_server = db_server_for(db_version)
    @user = @db_server.user
    login_token = FactoryBot.create(:login_token, user: @user)
    @crypto_key = @user.crypto_key('asdfasdf')
    @headers = {
      'Authorization' => login_token.token,
      'Crypto-Key' => @crypto_key
    }
  end

  def temp_db_server_for(version)
    config = DATABSE_CONFIGS.find { |conf| conf[:version] == version }
    {
      db_type: config[:db_type],
      host: '127.0.0.1',
      port: config[:port],
      username: config[:username],
      password: 'safe-db-password'
    }
  end

  def temp_db_config_for(db_version:)
    @temp_db_server = temp_db_server_for(db_version)
    @user = FactoryBot.create(:user)
    login_token = FactoryBot.create(:login_token, user: @user)
    @crypto_key = @user.crypto_key('asdfasdf')
    @headers = {
      'Authorization' => login_token.token,
      'Crypto-Key' => @crypto_key
    }
  end
end
