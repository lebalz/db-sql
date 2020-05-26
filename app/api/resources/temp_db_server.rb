# frozen_string_literal: true

module Resources
  class TempDbServer < Grape::API
    helpers do
      def db_server
        encrypted_password = DbServer.encrypt(
          key: request.headers['Crypto-Key'],
          db_password: params[:password]
        )
        db_server = DbServer.new(
          user: current_user,
          name: 'temp db server',
          db_type: DbServer.db_types[params[:db_type]],
          host: params[:host],
          port: params[:port],
          username: params[:username],
          password_encrypted: encrypted_password[:encrypted_password],
          initialization_vector: encrypted_password[:initialization_vector],
          initial_db: params[:initial_db],
          initial_table: params[:initial_table]
        )
        unless db_server.valid?
          error!(
            "Bad db connection: #{db_server.errors.full_messages.first}",
            302
          )
        end
        db_server
      end

      def crypto_key
        has_key = request.headers.key?('Crypto-Key')
        error!('Crypto-Key is required', 400) unless has_key

        request.headers['Crypto-Key']
      end
    end
    params do
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
    resource :temp_db_server do
      desc 'Get the database names of a database server connection'
      post :database_names do
        db_server.database_names(key: crypto_key)
      end

      desc 'Tests wheter a database server connection can be established'
      post :test do
        db_server.test_connection(key: crypto_key)
      end

      desc 'Get the databases of a database server connection'
      post :databases do
        present(
          db_server.database_names(key: crypto_key).map { |n| { name: n } },
          with: Entities::Database
        )
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
          db_server.exec_query(key: crypto_key, database_name: db_name) do
            params[:query]
          end.to_a
        end

        desc "Get the database's tables"
        post :tables do
          present(
            db_server.table_names(
              key: crypto_key,
              database_name: params[:database_name]
            ).map { |n| { name: n } },
            with: Entities::Table
          )
        end

        desc "Get the database's tables"
        post :table_names do
          db_server.table_names(
            key: crypto_key,
            database_name: params[:database_name]
          )
        end
        route_param :table_name, type: String, desc: 'Table name' do
          desc "Get the table's column names"
          post :column_names do
            db_server.column_names(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            )
          end
          desc "Get the table's columns"
          post :columns do
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
          post :primary_key_names do
            db_server.primary_key_names(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            )
          end
          desc "Get the table's foreign keys"
          post :foreign_keys do
            present db_server.foreign_keys(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            ), with: Entities::RailsForeignKey
          end
          desc "Get the table's indexes"
          post :indexes do
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
