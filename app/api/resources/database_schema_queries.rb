# frozen_string_literal: true

module Resources
  class DatabaseSchemaQueries < Grape::API
    helpers do
      def database_schema_query
        query = DatabaseSchemaQuery.find(params[:id])
        error!('Database schema query not found', 302) unless query
        unless query.public? || query.author_id == current_user.id
          error!('Invalid permission for this database schema query', 401)
        end

        query
      end
    end
    resource :database_schema_queries do
      desc 'Get database schema queries, by default 20 with no offset'
      params do
        optional(:limit, type: Integer, default: 20, desc: 'maximal number of returned database schema queries')
        optional(:offset, type: Integer,  default: 0, desc: 'offset of returned database schema queries')
        optional(:db_type, type: Symbol, default: %i[psql mysql], values: %i[psql mysql], desc: 'db type')
      end
      get do
        present(
          DatabaseSchemaQuery.where(is_private: false, db_type: params[:db_type])
                             .or(
                               DatabaseSchemaQuery.where(
                                 is_private: true,
                                 author_id: current_user.id,
                                 db_type: params[:db_type]
                               )
                             )
                             .offset(params[:offset])
                             .limit(params[:limit]),
          with: Entities::DatabaseSchemaQuery
        )
      end

      desc 'Create a new schema query'
      params do
        requires(:name, type: String, desc: 'Name')
        optional(:description, type: String, desc: 'description')
        requires(:db_type, type: Symbol, values: %i[psql mysql], desc: 'db type')
        optional(:is_private, type: Boolean, default: false, desc: 'is private')
        requires(:query, type: String, desc: 'database schema query')
      end
      post do
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
          unless database_schema_query.author_id = current_user.id
            error!('No permission to delete this query')
          end

          database_schema_query.destroy!
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
          error!("No permission") unless current_user.admin?

          database_schema_query.make_default!
          database_schema_query.reload
          present(database_schema_query, with: Entities::DatabaseSchemaQuery)
        end
      end
    end
  end
end
