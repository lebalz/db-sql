# frozen_string_literal: true

module Resources
  class TempDbConnection < Grape::API
    helpers do
      def db_connection
        encrypted_password = DbConnection.encrypt(
          key: request.headers['Crypto-Key'],
          db_password: params[:password]
        )
        connection = DbConnection.new(
          user: current_user,
          name: 'temp connection',
          db_type: DbConnection.db_types[params[:db_type]],
          host: params[:host],
          port: params[:port],
          username: params[:username],
          password_encrypted: encrypted_password[:encrypted_password],
          initialization_vector: encrypted_password[:initialization_vector],
          initial_db: params[:initial_db],
          initial_table: params[:initial_table]
        )
        unless connection.valid?
          error!(
            "Bad db connection: #{connection.errors.full_messages.first}",
            302
          )
        end
        connection
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
        values: DbConnection::DB_TYPES,
        desc: 'db type'
      )
      requires(:host, type: String, desc: 'host')
      requires(:port, type: Integer, desc: 'port')
      requires(:username, type: String, desc: 'db user')
      requires(:password, type: String, desc: 'db password')
      optional(:initial_db, type: String, desc: 'initial database')
      optional(:initial_table, type: String, desc: 'initial table')
    end
    resource :temp_db_connection do
      desc 'Get the database names of a db connection'
      post :database_names do
        db_connection.database_names(key: crypto_key)
      end

      desc 'Tests wheter a connection can be established'
      post :test do
        db_connection.test_connection(key: crypto_key)
      end

      desc 'Get the databases of a db connection'
      post :databases do
        present(
          db_connection.database_names(key: crypto_key).map { |n| { name: n } },
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
          db_connection.exec_query(key: crypto_key, database_name: db_name) do
            params[:query]
          end.to_a
        end

        desc "Get the database's tables"
        post :tables do
          present(
            db_connection.table_names(
              key: crypto_key,
              database_name: params[:database_name]
            ).map { |n| { name: n } },
            with: Entities::Table
          )
        end

        desc "Get the database's tables"
        post :table_names do
          db_connection.table_names(
            key: crypto_key,
            database_name: params[:database_name]
          )
        end
        route_param :table_name, type: String, desc: 'Table name' do
          desc "Get the table's column names"
          post :column_names do
            db_connection.column_names(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            )
          end
          desc "Get the table's columns"
          post :columns do
            primary_keys = db_connection.primary_key_names(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            )
            present db_connection.columns(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            ), with: Entities::Column, primary_keys: primary_keys
          end
          desc "Get the table's primary key names"
          post :primary_key_names do
            db_connection.primary_key_names(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            )
          end
          desc "Get the table's foreign keys"
          post :foreign_keys do
            present db_connection.foreign_keys(
              key: crypto_key,
              database_name: params[:database_name],
              table_name: params[:table_name]
            ), with: Entities::ForeignKey
          end
          desc "Get the table's indexes"
          post :indexes do
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
