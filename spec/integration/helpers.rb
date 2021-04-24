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
    { db_type: :mysql, username: 'root', port: 3380, version: 'm8' },
    { db_type: :mariadb, username: 'root', port: 3410, version: 'mariadb_10.5.3' }
  ].freeze

  def db_server_for(version, owner_type:, is_admin: true, email: 'sqler1@db.ch')
    config = DATABSE_CONFIGS.find { |conf| conf[:version] == version }
    user = User.find_by(email: email) || FactoryBot.create(:user, email: email)

    case owner_type
    when :user
      FactoryBot.create(
        :db_server,
        db_type: config[:db_type],
        username: config[:username],
        port: config[:port],
        user: user
      )
    when :group
      group = FactoryBot.create(:group)
      @group_crypto_key = Group.random_crypto_key
      group.add_user(user: user, group_key: @group_crypto_key, is_admin: true)
      db_server = FactoryBot.create(
        :db_server,
        :group,
        db_type: config[:db_type],
        username: config[:username],
        port: config[:port],
        group: group
      )
      db_server
    end
  end

  def config_for(db_version:, owner_type: :user, read_only_access: false, email: 'sqler1@db.ch')
    @db_server = db_server_for(db_version, owner_type: owner_type, is_admin: read_only_access, email: email)
    @owner = @db_server.owner
    case @db_server.owner_type
    when :user
      @user = @owner
    when :group
      @user = @owner.users.first
    end

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

  def sql_query(query, config: {})
    q = FactoryBot.create(:sql_query, config)
    q.query = query
    q
  end
end
