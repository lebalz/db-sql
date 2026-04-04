# frozen_string_literal: true

module Resources
  class Admin < Grape::API
    resource :admin do
      before do
        error!('No admin rights', 403) unless current_user.admin?
      end

      resource :users do
        desc 'Get all users'
        get do
          authorize User, :index?

          present User.all, with: Entities::User
        end

        route_param :id, type: String, desc: 'User id' do

          desc 'User'
          get do
            user = policy_scope(User).find(params[:id])
            authorize user, :show?

            present user, with: Entities::User
          end

          desc 'Delete user'
          delete do
            to_delete = policy_scope(User).find(params[:id])

            authorize to_delete, :destroy?
            error!(to_delete.errors.messages, 400) unless to_delete.destroy

            status :no_content
          end

          desc 'Update user'
          params do
            requires :data, type: Hash do
              optional(
                :role,
                type: Symbol,
                default: :user,
                values: %i[user admin],
                desc: 'user roles'
              )
            end
          end
          put do
            user = policy_scope(User).find(params[:id])
            authorize user, :update?

            change = ActionController::Parameters.new(params[:data])
            success = user.update(change.permit(:role))
            error!(user.errors.messages, 400) unless success

            status :no_content
          end
        end
      end
    end
  end
end
