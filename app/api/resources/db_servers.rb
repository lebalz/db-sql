# frozen_string_literal: true

module Resources
  class DbServers < Grape::API
    before do
      load_db_server if params.key?(:id)
    end
    helpers do
      def load_db_server
        db_server ||= policy_scope(DbServer).find(params[:id])

        authorize db_server, :show?

        @db_server = db_server
      end
      attr_reader :db_server

      def crypto_key
        has_key = request.headers.key?('Crypto-Key')
        error!('Crypto-Key is required', 400) unless has_key

        user_key = request.headers['Crypto-Key']
        return user_key unless params.key?(:id)

        case db_server.owner_type
        when :user
          user_key
        when :group
          group = db_server.owner
          group.crypto_key(current_user, current_user.private_key(user_key))
        end
      end
    end

    resource :db_servers do
      desc 'Get all database servers'
      params do
        optional(:include_shared, type: Boolean, default: false,
                                  desc: 'wheter to include shared db servers from groups')
      end
      get do
        authorize DbServer, :index?

        if params[:include_shared]
          present current_user.all_db_servers, with: Entities::DbServer
        else
          present current_user.db_servers, with: Entities::DbServer
        end
      end

      desc 'Create a database server'
      params do
        requires(:name, type: String, desc: 'Display text for this server')
        requires(
          :db_type,
          type: Symbol,
          default: :psql,
          values: %i[psql mysql mariadb],
          desc: 'db type'
        )
        requires(
          :owner_type,
          type: Symbol,
          values: %i(user group),
          desc: 'owner type'
        )
        optional(
          :owner_id,
          type: String,
          desc: 'owner id, must be set for owner_type :group'
        )
        requires(:host, type: String, desc: 'host')
        requires(:port, type: Integer, desc: 'port')
        requires(:username, type: String, desc: 'db user')
        requires(:password, type: String, desc: 'db password')
        optional(:initial_db, type: String, desc: 'initial database')
        optional(:initial_table, type: String, desc: 'initial table')
      end
      post do
        authorize DbServer, :create?

        user_key = request.headers['Crypto-Key']
        if params[:owner_type] == :user
          key = user_key
        else
          group = policy_scope(Group).find(params[:owner_id])

          authorize group, :add_db_server?

          key = group.crypto_key(current_user,
                                 current_user.private_key(user_key))
        end
        encrypted_password = DbServer.encrypt(
          key: key,
          db_password: params[:password]
        )
        db_server = DbServer.create!(
          user: params[:owner_type] == :user ? current_user : nil,
          group_id: params[:owner_type] == :group ? params[:owner_id] : nil,
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
        present(db_server, with: Entities::DbServer)
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
              values: %i[psql mysql mariadb],
              desc: 'db type'
            )
            optional(:host, type: String, desc: 'host')
            optional(:port, type: Integer, desc: 'port')
            optional(:username, type: String, desc: 'db user')
            optional(:password, type: String, desc: 'db password')
            optional(:initial_db, type: String, desc: 'initial database')
            optional(:initial_table, type: String, desc: 'initial table')
            optional(:database_schema_query_id, type: String,
                                                desc: 'id of the database schema query')
          end
        end
        put do
          authorize db_server, :update?

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
              :database_schema_query_id,
              :initial_db,
              :initial_table
            )
          )
          present(db_server, with: Entities::DbServer)
        end

        desc 'Delete a database server connection'
        delete do
          authorize db_server, :destroy?

          db_server.destroy!
          status :no_content
        end

        desc 'Get the databases of a database server connection'
        get :databases do
          present(
            db_server.database_names(key: crypto_key).map do |name|
              {
                name: name,
                db_server_id: db_server.id
              }
            end,
            with: Entities::Database
          )
        end
        desc 'Get the database names of a database server connection'
        get :database_names do
          db_server.database_names(key: crypto_key)
        end

        route_param :database_name, type: String, desc: 'Database name' do

          desc 'Get full database structure'
          get do
            full_db = db_server.full_database(key: crypto_key,
                                              database_name: params[:database_name])
            present(
              full_db,
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
            db_server.owner.touch
            sql_query = SqlQuery.new(db_server: db_server, user: current_user,
                                     db_name: db_name)
            t0 = Time.now

            begin
              result = db_server.exec_query(key: crypto_key,
                                            database_name: db_name) do
                params[:query]
              end
            rescue StandardError => e
              return present(
                {
                  error: e.message,
                  state: 'error',
                  time: Time.now - t0
                },
                with: Entities::QueryResult
              )
            end

            present(
              {
                result: result.to_a,
                state: 'success',
                time: Time.now - t0
              },
              with: Entities::QueryResult
            )
          end

          desc 'Query the database with mutliple statements'
          params do
            requires(:queries, type: Array[String])
            optional(:proceed_after_error, type: Boolean, default: true,
                                           desc: 'Wheter to proceed query execution after an error or not.')
          end
          post :multi_query do
            db_name = params[:database_name]
            results = []
            error_occured = false
            db_server.owner.touch

            sql_query = SqlQuery.new(db_server: db_server, user: current_user,
                                     db_name: db_name)
            sql_query.query = params[:queries].join("\n")

            db_server.reuse_connection do |conn|
              params[:queries].each do |query|
                next if query.blank?

                if error_occured && !params[:proceed_after_error]
                  results << {
                    state: :skipped,
                    time: 0
                  }
                  next
                end

                t0 = Time.now
                begin
                  db_server.increment!(:query_count, 1)
                  results << {
                    result: conn.exec_query(key: crypto_key,
                                            database_name: db_name) do
                              query
                            end.to_a,
                    state: 'success',
                    time: Time.now - t0
                  }
                rescue StandardError => e
                  db_server.increment!(:error_query_count, 1)
                  error_occured = true
                  results << {
                    error: e.message,
                    state: 'error',
                    time: Time.now - t0
                  }
                end
              end
            end
            sql_query.is_valid = !error_occured
            sql_query.save!

            present(results, with: Entities::QueryResult)
          end

          desc 'Query the database and returns the raw result. Multiple query statements are allowed'
          params do
            requires(:query, type: String)
          end
          post :raw_query do
            db_server.owner.touch
            db_name = params[:database_name]

            sql_query = SqlQuery.new(db_server: db_server, user: current_user,
                                     db_name: db_name)
            sql_query.query = params[:query]

            t0 = Time.now
            db_server.increment!(:query_count, 1)
            results = db_server.exec_raw_query(key: crypto_key,
                                               database_name: db_name) do
              params[:query]
            end
            t_end = Time.now - t0

            if results[:type] == :error
              db_server.increment!(:error_query_count, 1)
            end
            sql_query.is_valid = results[:type] != :error
            sql_query.save!

            results.merge({ time: t_end })
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
                with: Entities::RailsColumn
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
              ), with: Entities::RailsForeignKey
            end

            desc "Get the table's indexes"
            get :indexes do
              present db_server.indexes(
                key: crypto_key,
                database_name: params[:database_name],
                table_name: params[:table_name]
              ), with: Entities::RailsIndex
            end
          end
        end
      end
    end
  end
end
