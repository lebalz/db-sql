# frozen_string_literal: true

class SeedDbServers
  def self.perform
    user = User.find_by(email: 'test@user.ch')
    encrypted_password = DbServer.encrypt(
      key: user.crypto_key('asdfasdf'),
      db_password: Rails.configuration.database_configuration[Rails.env]['password']
    )
    DbServer.create!(
      name: 'dev',
      db_type: :psql,
      host: ActiveRecord::Base.connection_config[:host],
      port: 5432,
      initialization_vector: encrypted_password[:initialization_vector],
      username: Rails.configuration.database_configuration[Rails.env]['username'],
      password_encrypted: encrypted_password[:encrypted_password],
      initial_db: ActiveRecord::Base.connection_config[:database],
      user: user,
      database_schema_query: DatabaseSchemaQuery.default(db_type: :psql)
    )

    encrypted_password = DbServer.encrypt(
      key: user.crypto_key('asdfasdf'),
      db_password: 'safe-db-password'
    )
    # setup test db instances from docker-compose.yml
    [
      { db_type: :psql, username: 'postgres', port: 5009, version: '9.3' },
      { db_type: :psql, username: 'postgres', port: 5010, version: '10' },
      { db_type: :psql, username: 'postgres', port: 5011, version: '11' },
      { db_type: :psql, username: 'postgres', port: 5012, version: '12' },
      { db_type: :mysql, username: 'root', port: 3356, version: '5.6' },
      { db_type: :mysql, username: 'root', port: 3357, version: '5.7' },
      { db_type: :mysql, username: 'root', port: 3380, version: '8.0' }
    ].each do |config|
      DbServer.create!(
        name: "spec v#{config[:version]}",
        db_type: config[:db_type],
        host: '127.0.0.1',
        port: config[:port],
        initialization_vector: encrypted_password[:initialization_vector],
        username: config[:username],
        password_encrypted: encrypted_password[:encrypted_password],
        initial_db: 'ninja_turtles_db',
        user: user,
        database_schema_query: DatabaseSchemaQuery.default(db_type: config[:db_type])
      )
    end
    return unless File.exist? Rails.root.join('db_servers.yaml')

    db_servers = YAML.load_file(Rails.root.join('db_servers.yaml'))
    db_servers.each do |name, db_server|
      user = User.find_by(email: db_server['app_user'])
      user_password = db_server['app_user_password']
      next unless user && user_password

      encrypted_password = DbServer.encrypt(
        key: user.crypto_key(user_password),
        db_password: db_server['db_password']
      )
      DbServer.create!(
        name: name,
        db_type: db_server['db_type'],
        host: db_server['db_host'],
        port: db_server['db_port'],
        initialization_vector: encrypted_password[:initialization_vector],
        username: db_server['db_username'],
        password_encrypted: encrypted_password[:encrypted_password],
        initial_db: db_server['db_initial_db'],
        initial_table: db_server['db_initial_table'],
        user: user,
        database_schema_query: DatabaseSchemaQuery.default(db_type: db_server['db_type'])
      )
    end
  end
end
