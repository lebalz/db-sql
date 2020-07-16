# frozen_string_literal: true

module Resources
  class SqlQueries < Grape::API
    helpers do
      def sql_query
        return @quey unless @quey.nil?

        query = SqlQuery.includes(:db_server).find(params[:id])

        error!('Sql query not found', 302) unless query
        unless query.authorized?(current_user)
          error!('You are not authorized to access this query', 401)
        end

        @quey = query
      end
    end

    resource :sql_queries do
      desc 'Get all sql queries of the current user'
      get do
        present(
          current_user.sql_queries,
          with: Entities::SqlQuery
        )
      end

      params do
        requires(:group_id, type: String, desc: 'group id')
      end
      get :shared do
        group = Group.find(params[:group_id])
        error!('Group not found', 302) unless group
        
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
          authorized = sql_query.user_id == current_user.id || (
            sql_query.db_server.owner_type == :group && sql_query.db_server.owner.admin?(current_user)
          )

          unless authorized
            error!('No permission to update this query', 302)
          end
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