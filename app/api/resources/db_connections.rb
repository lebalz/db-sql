module Resources
  class DbConnections < Grape::API
    helpers do
      def db_connection
        DbConnection.find(params[:id])
      end

      def crypto_key
        request.headers['Crypto-Key']
      end
    end

    resource :db_connections do
      desc 'Get all connections'
      get do
        present current_user.db_connections, with: Entities::DbConnection
      end

      desc 'Create db connection'
      params do
        requires :name, type: String, desc: 'Display text for this connection'
        requires :db_type, type: Symbol, default: :psql, values: %i[psql mysql mariadb sqlite], desc: 'db type'
        requires :host, type: String, desc: 'host'
        requires :port, type: Integer, desc: 'port'
        requires :username, type: String, desc: 'db user'
        requires :password, type: String, desc: 'db password'
        optional :initial_db, type: String, desc: 'initial database'
        optional :initial_schema, type: String, desc: 'initial schema'
      end
      post do
        require 'pry'; binding.pry;
        encrypted_password = DbConnection.encrypt(
          key: request.headers['Crypto-Key'],
          password: params[:password]
        )
        db_connection = DbConnection.create!(
          user: current_user,
          name: params[:name],
          db_type: DbConnection.db_types[params[:db_type]],
          host: params[:host],
          port: params[:port],
          username: params[:username],
          password_encrypted: encrypted_password[:encrypted_password],
          initialization_vector: encrypted_password[:initialization_vector],
          initial_db: params[:initial_db],
          initial_schema: params[:initial_schema]
        )
        present db_connection, with: Entities::DbConnection
      end

      route_param :id, type: String, desc: 'DB Connection ID' do
        desc 'Get a specific db connection'
        get do
          present db_connection, with: Entities::DbConnection
        end

        desc 'Get cleartext password'
        get :password do
          { password: db_connection.password(crypto_key) }
        end

        desc 'Update a connection'
        params do
          requires :data, type: Hash do
            optional :name, type: String, desc: 'Display text for this connection'
            optional :db_type, type: Symbol, values: %i[psql mysql mariadb sqlite], desc: 'db type'
            optional :host, type: String, desc: 'host'
            optional :port, type: Integer, desc: 'port'
            optional :username, type: String, desc: 'db user'
            optional :password, type: String, desc: 'db password'
            optional :initial_db, type: String, desc: 'initial database'
            optional :initial_schema, type: String, desc: 'initial schema'
          end
        end
        put do
          if params[:data].key?('password')
            encrypted_password = DbConnection.encrypt(
              key: crypto_key,
              password: params[:data]['password']
            )
            params[:data]['password_encrypted'] = encrypted_password[:encrypted_password]
            params[:data]['initialization_vector'] = encrypted_password[:initialization_vector]
            params[:data].delete('password')
          end
          db_connection.update!(params[:data])
          present db_connection, with: Entities::DbConnection
        end

        
        desc 'Delete a connection'
        delete do
          db_connection.destroy!
          status :no_content
        end

        desc 'Get the databases of a db connection'
        get :databases do
          { databases: db_connection.databases(key: crypto_key) }
        end
      end
    end
  end
end
