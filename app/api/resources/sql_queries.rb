# frozen_string_literal: true

module Resources
  class SqlQueries < Grape::API
    helpers do
      def sql_query
        return @query unless @query.nil?

        query = SqlQuery.includes(:db_server).find(params[:id])

        authorize query, :show?

        @query = query
      end
    end

    resource :sql_queries do
      desc 'Get all sql queries of the current user'
      get do
        authorize SqlQuery, :index?

        present(
          policy_scope(SqlQuery).order('is_favorite desc', 'updated_at desc'),
          with: Entities::SqlQuery
        )
      end

      params do
        requires(:group_id, type: String, desc: 'group id')
      end
      get :shared do
        group = policy_scope(Group).find(params[:group_id])

        authorize group, :show?

        db_servers = group.db_servers.select(:id).to_sql
        queries = SqlQuery.where(is_private: false).where(
          "db_server_id in (#{db_servers})"
        )

        present(
          queries.order('is_favorite desc', 'updated_at desc'),
          with: Entities::SqlQuery
        )
      end

      route_param :id, type: String, desc: 'update sql query id' do
        desc 'get sql query'
        get do
          query = SqlQuery.includes(:db_server).find(params[:id])
          authorize query, :show?
  
          present(sql_query, with: Entities::SqlQuery)
        end

        desc 'update props of an sql query'
        params do
          requires :data, type: Hash do
            optional(:is_private, type: Boolean, desc: 'is_private')
            optional(:is_favorite, type: String, desc: 'is_favorite')
          end
        end
        put do
          authorize sql_query, :update?

          change = ActionController::Parameters.new(params[:data])
          sql_query.update!(
            change.permit(
              :is_private,
              :is_favorite
            )
          )
          present(sql_query, with: Entities::SqlQuery)
        end
      end
    end
  end
end
