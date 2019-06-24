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
          present User.all, with: Entities::User
        end

        route_param :id, type: String, desc: 'User id' do

          desc 'User'
          get do
            user = User.find(params[:id])
            error!('User not found', 404) unless user
            present user, with: Entities::User
          end

          desc 'Delete user'
          delete do
            delete_self = current_user.id == params[:id]
            error!('You can not delete current user', 403) if delete_self

            to_delete = User.find(params[:id])
            error!('User not found', 404) unless to_delete
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
                values: User::ROLES,
                desc: 'user roles'
              )
            end
          end
          put do
            user = User.find(params[:id])
            error!('User not found', 404) unless user

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
