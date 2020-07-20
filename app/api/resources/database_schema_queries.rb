# frozen_string_literal: true

module Resources
  class DatabaseSchemaQueries < Grape::API
    before do
      load_database_schema_query if params.key?(:id)
    end
    helpers do
      def load_database_schema_query
        query = policy_scope(DatabaseSchemaQuery).includes(:db_servers).find(params[:id])
        authorize query, :show?

        @database_schema_query = query
      end
      attr_reader :database_schema_query
    end
    resource :database_schema_queries do
      desc 'Get database schema queries, by default 20 with no offset'
      params do
        optional(:limit, type: Integer, default: 20, desc: 'maximal number of returned database schema queries')
        optional(:offset, type: Integer,  default: 0, desc: 'offset of returned database schema queries')
        optional(:db_type, type: Symbol, default: %i[psql mysql mariadb], values: %i[psql mysql mariadb], desc: 'db type')
      end
      get do
        authorize DatabaseSchemaQuery, :index?

        escaped_id = ActiveRecord::Base.connection.quote(current_user.id)
        order_query = Arel.sql("is_default DESC, author_id = #{escaped_id} DESC, updated_at DESC")
        present(
          DatabaseSchemaQuery.available(params[:db_type], current_user)
                             .order(order_query)
                             .includes(:db_servers)
                             .offset(params[:offset])
                             .limit(params[:limit]),
          with: Entities::DatabaseSchemaQuery
        )
      end

      desc 'Get number of avlailable schema queries'
      get :counts do
        authorize DatabaseSchemaQuery, :index?

        DbServer::DB_TYPES.map do |db_type|
          [db_type, DatabaseSchemaQuery.available(db_type, current_user).count]
        end.to_h
      end

      desc 'Create a new schema query'
      params do
        requires(:name, type: String, desc: 'Name')
        optional(:description, type: String, desc: 'description')
        requires(:db_type, type: Symbol, values: %i[psql mysql mariadb], desc: 'db type')
        optional(:is_private, type: Boolean, default: false, desc: 'is private')
        requires(:query, type: String, desc: 'database schema query')
      end
      post do
        authorize DatabaseSchemaQuery, :create?

        schema_query = DatabaseSchemaQuery.create(
          author_id: current_user.id,
          name: params[:name],
          description: params[:description],
          db_type: params[:db_type],
          is_private: params[:is_private],
          query: params[:query]
        )
        present(schema_query, with: Entities::DatabaseSchemaQuery)
      end

      desc 'Get the default database schema queries'
      route_setting :auth, disabled: true
      get :default do
        authorize DatabaseSchemaQuery, :index?

        present(
          DbServer::DB_TYPES.map do |db_type|
            DatabaseSchemaQuery.default(db_type)
          end,
          with: Entities::DatabaseSchemaQuery
        )
      end

      route_param :id, type: String, desc: 'Database schema query ID' do
        desc 'Get a specific database schema query'
        get do
          present(database_schema_query, with: Entities::DatabaseSchemaQuery)
        end

        desc 'Delete a database schema query'
        delete do
          authorize database_schema_query, :destroy?

          begin
            database_schema_query.destroy!
          rescue StandardError
            error!('A referenced query can not be destroyed', 403)
          end
          status :no_content
        end

        desc 'update a database schema query'
        params do
          requires :data, type: Hash do
            optional(:is_private, type: Boolean, desc: 'is_private')
            optional(:query, type: String, desc: 'query')
            optional(:name, type: String, desc: 'name')
            optional(:description, type: String, desc: 'description')
          end
        end
        put do
          authorize database_schema_query, :update?

          change = ActionController::Parameters.new(params[:data])
          database_schema_query.update!(
            change.permit(
              :is_private,
              :query,
              :name,
              :description
            )
          )
          present(database_schema_query, with: Entities::DatabaseSchemaQuery)
        end

        desc 'make default'
        post :make_default do
          authorize database_schema_query, :change_default?

          begin
            database_schema_query.make_default!
          rescue StandardError
            error!('The default query can not be private', 403)
          end
          database_schema_query.reload
          present(database_schema_query, with: Entities::DatabaseSchemaQuery)
        end
      end
    end
  end
end
