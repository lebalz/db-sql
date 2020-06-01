# frozen_string_literal: true

module Resources
  class DatabaseSchemaQueries < Grape::API
    helpers do
      def database_schema_query
        query = DatabaseSchemaQuery.find(params[:id])
        error!('Database schema query not found', 302) unless query
        unless query.public? || query.user_id == current_user.id
          error!('Invalid permission for this database schema query', 401)
        end

        query
      end
    end

    resource :database_schema_queries do
      desc 'Get all database schema queries'
      get do
        present(
          DatabaseSchemaQuery.where(is_private: false),
          with: Entities::DatabaseSchemaQuery
        )
      end

      desc 'Get all database schema queries'
      params do
        optional(:limit, type: Integer, desc: 'maximal number of returned database schema queries')
        optional(:offset, type: Integer, desc: 'offset of returned database schema queries')
      end
      get :latest_revisions do
        present(
          DatabaseSchemaQuery.latest_revisions(author_id: current_user.id)
                             .offset(params[:offset])
                             .limit(params[:limit]),
          with: Entities::DatabaseSchemaQuery
        )
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
          error!('No permission to delete this query') unless database_schema_query.author_id = current_user.id

          database_schema_query.destroy!
          status :no_content
        end

        desc 'Revisions, including past and future revisions of this database schema query'
        get :revisions do
          database_schema_query.revisions
        end

        desc 'new revision of a database schema query'
        params do
          requires :data, type: Hash do
            optional(:db_type, type: String, desc: 'db_type')
            optional(:is_private, type: String, desc: 'is_private')
            optional(:query, type: String, desc: 'query')
          end
        end
        post :new_revision do
          new_revision = database_schema_query.clone
          change = ActionController::Parameters.new(
            params[:data].merge(
              author_id: current_user.id,
              previous_revision_id: database_schema_query.id
            )
          )
          new_revision.update!(
            change.permit(
              :db_type,
              :is_default,
              :is_private,
              :query,
              :author_id,
              :previous_revision_id
            )
          )
          present(new_revision, with: Entities::DatabaseSchemaQuery)
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
