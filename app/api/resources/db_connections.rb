# frozen_string_literal: true

module Resources
  class DbConnections < Grape::API
    helpers do
      def db_connection
        connection = DbConnection.find(params[:id])
        error!('Db connection not found', 302) unless connection

        connection
      end

      def crypto_key
        has_key = request.headers.key?('Crypto-Key')
        error!('Crypto-Key is required', 400) unless has_key

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
        requires(:name, type: String, desc: 'Display text for this connection')
        requires(
          :db_type,
          type: Symbol,
          default: :psql,
          values: DbConnection::DB_TYPES,
          desc: 'db type'
        )
        requires(:host, type: String, desc: 'host')
        requires(:port, type: Integer, desc: 'port')
        requires(:username, type: String, desc: 'db user')
        requires(:password, type: String, desc: 'db password')
        optional(:initial_db, type: String, desc: 'initial database')
        optional(:initial_schema, type: String, desc: 'initial schema')
      end
      post do
        encrypted_password = DbConnection.encrypt(
          key: request.headers['Crypto-Key'],
          db_password: params[:password]
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
          {
            password: db_connection.password(crypto_key)
          }
        end

        desc 'Update a connection'
        params do
          requires :data, type: Hash do
            optional(
              :name,
              type: String,
              desc: 'Display text for this connection'
            )
            optional(
              :db_type,
              type: Symbol,
              values: %i[psql mysql mariadb sqlite],
              desc: 'db type'
            )
            optional(:host, type: String, desc: 'host')
            optional(:port, type: Integer, desc: 'port')
            optional(:username, type: String, desc: 'db user')
            optional(:password, type: String, desc: 'db password')
            optional(:initial_db, type: String, desc: 'initial database')
            optional(:initial_schema, type: String, desc: 'initial schema')
          end
        end
        put do
          if params[:data].key?('password')
            encrypted_password = DbConnection.encrypt(
              key: crypto_key,
              db_password: params[:data]['password']
            )
            db_connection.update!(
              password_encrypted: encrypted_password[:encrypted_password],
              initialization_vector: encrypted_password[:initialization_vector]
            )
          end
          change = ActionController::Parameters.new(params[:data])
          db_connection.update!(
            change.permit(
              :name,
              :db_type,
              :host,
              :port,
              :username,
              :initial_db,
              :initial_schema
            )
          )
          present db_connection, with: Entities::DbConnection
        end

        desc 'Delete a connection'
        delete do
          db_connection.destroy!
          status :no_content
        end

        desc 'Get the databases of a db connection'
        get :databases do
          present(
            db_connection.database_names(key: crypto_key).map { |n| { name: n } },
            with: Entities::Database
          )
        end
        desc 'Get the database names of a db connection'
        get :database_names do
          db_connection.database_names(key: crypto_key)
        end
        route_param :database_name, type: String, desc: 'Database name' do
          desc 'Query the database'
          params do
            requires(
              :query,
              type: String,
              desc: 'Sql query to perform on the database'
            )
          end
          post :query do
            db_name = params[:database_name]
            db_connection.exec_query(key: crypto_key, database_name: db_name) do
              params[:query]
            end.to_a
          end

          desc "Get the database's tables"
          get :databases do
            present(
              db_connection.table_names(
                key: crypto_key,
                database_name: params[:database_name]
              ).map { |n| { name: n } },
              with: Entities::Table
            )
          end

          desc "Get the names of the database's tables"
          get :table_names do
            db_connection.table_names(
              key: crypto_key,
              database_name: params[:database_name]
            )
          end
          route_param :table_name, type: String, desc: 'Table name' do
            desc "Get the table's column names"
            get :column_names do
              db_connection.column_names(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              )
            end
            desc "Get the table's columns"
            get :columns do
              present db_connection.columns(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              ), with: Entities::Column
            end
            desc "Get the table's primary key names"
            get :primary_key_names do
              db_connection.primary_key_names(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              )
            end
            desc "Get the table's foreign keys"
            get :foreign_keys do
              present db_connection.foreign_keys(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              ), with: Entities::ForeignKey
            end
            desc "Get the table's indexes"
            get :indexes do
              present db_connection.indexes(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              ), with: Entities::Index
            end
          end
        end
      end
    end
  end
end
