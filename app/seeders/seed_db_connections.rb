# frozen_string_literal: true

class SeedDbConnections
  def self.perform
    user = User.find_by(email: 'test@user.ch')
    encrypted_password = DbConnection.encrypt(
      key: user.crypto_key('asdfasdf'),
      password: ActiveRecord::Base.connection_config[:database]
    )
    DbConnection.create!(
      name: 'dev',
      db_type: :psql,
      host: ActiveRecord::Base.connection_config[:host],
      port: 5432,
      initialization_vector: encrypted_password[:initialization_vector],
      username: ENV.fetch("DB_SQL_DATABASE_USER"),
      password_encrypted: encrypted_password[:encrypted_password],
      initial_db: ActiveRecord::Base.connection_config[:database],
      user: user
    )
    return unless File.exist? Rails.root.join('db_connections.yaml')
  
    connections = YAML.load_file(Rails.root.join('db_connections.yaml'))
    connections.each do |name, connection|
      user = User.find_by(email: connection['app_user'])
      user_password = connection['app_user_password']
      next unless user && user_password

      encrypted_password = DbConnection.encrypt(
        key: user.crypto_key(user_password),
        password: connection['db_password']
      )
      DbConnection.create!(
        name: name,
        db_type: connection['db_type'],
        host: connection['db_host'],
        port: connection['db_port'],
        initialization_vector: encrypted_password[:initialization_vector],
        username: connection['db_username'],
        password_encrypted: encrypted_password[:encrypted_password],
        initial_db: connection['db_initial_db'],
        initial_schema: connection['db_initial_schema'],
        user: user
      )
    end
  end
end
