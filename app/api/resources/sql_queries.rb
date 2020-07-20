# frozen_string_literal: true

module Resources
  class SqlQueries < Grape::API
    helpers do
      def sql_query
        return @quey unless @quey.nil?

        query = policy_scope(SqlQuery).includes(:db_server).find(params[:id])

        authorize query, :show?

        @quey = query
      end
    end

    resource :sql_queries do
      desc 'Get all sql queries of the current user'
      get do
        authorize SqlQuery, :index?

        present(
          policy_scope(SqlQuery),
          with: Entities::SqlQuery
        )
      end

      params do
        requires(:group_id, type: String, desc: 'group id')
      end
      get :shared do
        group = policy_cope(Group).find(params[:group_id])

        authorize group, :show?

        present(
          group.sql_queries,
          with: Entities::SqlQuery
        )
      end

      route_param :id, type: String, desc: 'update sql query id' do
        desc 'get sql query'
        get do
          present(sql_query, with: Entities::SqlQuery)
        end

        desc 'update the description of a sql query'
        params do
          requires :data, type: Hash do
            optional(:is_private, type: Boolean, desc: 'is_private')
            optional(:is_favorite, type: String, desc: 'is_faforite')
            optional(:description, type: String, desc: 'name')
          end
        end
        put do
          authorize sql_query, :update?

          change = ActionController::Parameters.new(params[:data])
          sql_query.update!(
            change.permit(
              :is_private,
              :is_favorite,
              :description
            )
          )
          present(sql_query, with: Entities::SqlQuery)
        end
      end
    end
  end
end
