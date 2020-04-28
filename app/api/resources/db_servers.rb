# frozen_string_literal: true

module Resources
  class DbServers < Grape::API
    helpers do
      def db_server
        db_server = DbServer.find(params[:id])
        error!('Db server not found', 302) unless db_server

        db_server
      end

      def crypto_key
        has_key = request.headers.key?('Crypto-Key')
        error!('Crypto-Key is required', 400) unless has_key

        request.headers['Crypto-Key']
      end
    end

    resource :db_servers do
      desc 'Get all database servers'
      get do
        present current_user.db_servers, with: Entities::DbServer
      end

      desc 'Create a database server'
      params do
        requires(:name, type: String, desc: 'Display text for this server')
        requires(
          :db_type,
          type: Symbol,
          default: :psql,
          values: %i[psql mysql mariadb sqlite],
          desc: 'db type'
        )
        requires(:host, type: String, desc: 'host')
        requires(:port, type: Integer, desc: 'port')
        requires(:username, type: String, desc: 'db user')
        requires(:password, type: String, desc: 'db password')
        optional(:initial_db, type: String, desc: 'initial database')
        optional(:initial_table, type: String, desc: 'initial table')
      end
      post do
        encrypted_password = DbServer.encrypt(
          key: request.headers['Crypto-Key'],
          db_password: params[:password]
        )
        db_server = DbServer.create!(
          user: current_user,
          name: params[:name],
          db_type: DbServer.db_types[params[:db_type]],
          host: params[:host],
          port: params[:port],
          username: params[:username],
          password_encrypted: encrypted_password[:encrypted_password],
          initialization_vector: encrypted_password[:initialization_vector],
          initial_db: params[:initial_db],
          initial_table: params[:initial_table]
        )
        present db_server, with: Entities::DbServer
      end

      route_param :id, type: String, desc: 'Database server ID' do
        desc 'Get a specific database server'
        get do
          present db_server, with: Entities::DbServer
        end

        desc 'Get cleartext password'
        get :password do
          {
            password: db_server.password(crypto_key)
          }
        end

        desc 'Update a database server'
        params do
          requires :data, type: Hash do
            optional(
              :name,
              type: String,
              desc: 'Display text for this database server connection'
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
            optional(:initial_table, type: String, desc: 'initial table')
          end
        end
        put do
          if params[:data].key?('password')
            encrypted_password = DbServer.encrypt(
              key: crypto_key,
              db_password: params[:data]['password']
            )
            db_server.update!(
              password_encrypted: encrypted_password[:encrypted_password],
              initialization_vector: encrypted_password[:initialization_vector]
            )
          end
          change = ActionController::Parameters.new(params[:data])
          db_server.update!(
            change.permit(
              :name,
              :db_type,
              :host,
              :port,
              :username,
              :initial_db,
              :initial_table
            )
          )
          present db_server, with: Entities::DbServer
        end

        desc 'Delete a database server connection'
        delete do
          db_server.destroy!
          status :no_content
        end

        desc 'Get the databases of a database server connection'
        get :databases do
          dbs = db_server.reuse_connection do
            db_server.database_names(key: crypto_key).map do |n|
              search_path = db_server.schema_search_path(
                key: crypto_key,
                database_name: n
              )
              {
                name: n,
                db_server_id: db_server.id,
                schema_search_path: search_path
              }
            end
          end
          present(dbs, with: Entities::Database)
        end
        desc 'Get the database names of a database server connection'
        get :database_names do
          db_server.database_names(key: crypto_key)
        end
        route_param :database_name, type: String, desc: 'Database name' do

          desc 'Get full database structure'
          get do
            present(
              db_server.full_database(key: crypto_key, database_name: params[:database_name]),
              with: Entities::FullDatabase
            )
          end

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
            db_server.increment!(:query_count, 1)
            db_server.user.touch
            db_server.exec_query(key: crypto_key, database_name: db_name) do
              params[:query]
            end.to_a
          end

          desc 'Query the database with mutliple statements'
          params do
            requires(:queries, type: Array[String])
            optional(:proceed_after_error, type: Boolean, default: true, desc: 'Wheter to proceed query execution after an error or not.')
          end
          post :multi_query do
            db_name = params[:database_name]
            results = []
            error_occured = false
            db_server.user.touch

            db_server.reuse_connection do |conn|
              params[:queries].each do |query|
                next if query.blank?

                if error_occured && !params[:proceed_after_error]
                  results << {
                    type: :skipped,
                    time: 0
                  }
                  next
                end

                t0 = Time.now
                begin
                  db_server.increment!(:query_count, 1)
                  results << {
                    result: conn.exec_query(key: crypto_key, database_name: db_name) do
                      query
                    end.to_a,
                    type: 'success',
                    time: Time.now - t0
                  }
                rescue StandardError => e
                  db_server.increment!(:error_query_count, 1)
                  error_occured = true
                  results << {
                    error: e.message,
                    type: 'error',
                    time: Time.now - t0
                  }
                end
              end
            end
            present(results, with: Entities::QueryResult)
          end

          desc 'Query the database and returns the raw result. Multiple query statements are allowed'
          params do
            requires(:query, type: String)
          end
          post :raw_query do
            db_server.user.touch
            db_name = params[:database_name]
            t0 = Time.now
            db_server.increment!(:query_count, 1)
            results = db_server.exec_raw_query(key: crypto_key, database_name: db_name) do
              params[:query]
            end
            db_server.increment!(:error_query_count, 1) if results[:type] == :error

            results.merge({ time: Time.now - t0 })
          end

          desc "Get the database's tables"
          get :tables do
            present(
              db_server.table_names(
                key: crypto_key,
                database_name: params[:database_name]
              ).map { |n| { name: n } },
              with: Entities::Table
            )
          end

          desc "Get the names of the database's tables"
          get :table_names do
            db_server.table_names(
              key: crypto_key,
              database_name: params[:database_name]
            )
          end
          route_param :table_name, type: String, desc: 'Table name' do
            desc "Get the table's column names"
            get :column_names do
              db_server.column_names(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              )
            end

            desc "Get the table's columns"
            get :columns do
              primary_keys = db_server.primary_key_names(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              )
              columns = db_server.columns(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              )
              present(
                columns.map do |col|
                  col.merge({ is_primary: primary_keys.include?(col[:name]) })
                end,
                with: Entities::Column
              )
            end

            desc "Get the table's primary key names"
            get :primary_key_names do
              db_server.primary_key_names(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              )
            end

            desc "Get the table's foreign keys"
            get :foreign_keys do
              present db_server.foreign_keys(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              ), with: Entities::ForeignKey
            end

            desc "Get the table's indexes"
            get :indexes do
              present db_server.indexes(
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
