module Resources
  class Admin < Grape::API
    resource :admin do
      before do
        error!('No admin rights', 401) unless current_user.admin?
      end

      resource :users do
        desc 'Get current user'
        get do
          present User.all, with: Entities::User
        end

        route_param :id, type: String, desc: 'User id' do
          desc 'Delete user'
          delete do
            error!('You can not delete current user', 401) if current_user.id == params[:id]
            to_delete = User.find(params[:id])
            error!('User not found', 404) unless to_delete
            error!(to_delete.errors.messages, 400) unless to_delete.destroy()
            return status :no_content
          end

          desc 'Update user'
          params do
            requires :data, type: Hash do
              optional :role, type: Symbol, default: :user, values: User.roles.symbolize_keys.keys, desc: 'user roles'
            end
          end
          put do
            user = User.find(params[:id])
            error!('User not found', 404) unless user

            change = ActionController::Parameters.new(params[:data])
            error!(user.errors.messages, 400) unless user.update(change.permit(:role))
            return status :no_content
          end
        end
      end
    end
  end
end
