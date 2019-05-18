module Resources
  class Users < Grape::API
    resource :user do
      desc 'Get current user'
      get do
        present current_user, with: Entities::User
      end

      desc 'Validates token <-> user integrity'
      params do
        requires :id, type: String, desc: 'id of the user'
        requires :email, type: String, desc: 'users email'
      end
      post :validate do
        valid_id = current_user.id == params[:id];
        valid_mail = current_user.email == params[:email]
        {
          valid: valid_id && valid_mail
        }
      end
    end
  end
end
