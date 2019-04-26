module Resources
  class DbConnections < Grape::API
    resource :db_connections do
      desc 'Get all Connections'
      get do
        present current_user.db_connections, with: Entities::DbConnection
      end

      desc 'Create DB Connection'
      params do
        requires :name, type: String, desc: 'Display text for this connection'
        requires :db_type, type: Symbol, default: :psql, values: %i[psql mysql mariadb sqlite], desc: 'db type'
        requires :host, type: String, desc: 'host'
        requires :port, type: Integer, desc: 'port'
        requires :password, type: String, desc: 'db password'
        optional :initial_db, type: String, desc: 'initial database'
        optional :initial_schema, type: String, desc: 'initial schema'
      end
      post do
        encrypted_password = DbConnection.encrypt(
          key: request.headers['Encryption-Key'],
          password: params[:password]
        )
        db_connection = DbConnection.create!(
          user: current_user,
          name: params[:name],
          db_type: DbConnection.db_types[params[:db_type]],
          host: params[:host],
          port: params[:port],
          password_encrypted: encrypted_password[:encrypted_password],
          initialization_vector: encrypted_password[:initialization_vector],
          initial_db: params[:initial_db],
          initial_schema: params[:initial_schema]
        )
        present db_connection, with: Entities::DbConnection
      end
    end
  end
end
