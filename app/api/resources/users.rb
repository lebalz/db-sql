module Resources
  class Users < Grape::API
    helpers do
      def logout_existing_user
        token = request.headers['Authorization']
        return unless token
        
        login_token = LoginToken.find_by(token: token)
        return unless login_token

        login_token.destroy
      end
    end
    resource :user do
      desc 'Get current user'
      get do
        present current_user, with: Entities::User
      end

      desc 'Get the role of a user'
      get :role do
        {
          role: current_user.role
        }
      end

      desc 'Set new password'
      params do
        requires :old_password, type: String, desc: 'old password'
        requires :new_password, type: String, desc: 'new password'
        requires :password_confirmation, type: String, desc: 'new password confirmation'
      end
      post :new_password do
        error!('Incorrect old password', 401) unless current_user.authenticate(params[:old_password])

        is_confirmed = params[:new_password] === params[:password_confirmation]
        error!('Password confirmation does not match new password', 400) unless is_confirmed
        @user = current_user
        @user.change_password!(
          old_password: params[:old_password],
          new_password: params[:new_password],
          password_confirmation: params[:password_confirmation]
        )
        @user.reload
        token = @user.login(params[:new_password])
        if token
          crypto_key = @user.crypto_key(params[:new_password])
          present(
            @user,
            with: Entities::User,
            token: token,
            crypto_key: crypto_key
          )
        else
          error!('Failed to update password', 401)
        end
      end

      route_setting :auth, disabled: true
      params do
        requires :email, type: String
        requires :password, type: String
      end
      post :signup do
        logout_existing_user
        @user = User.create(email: params[:email], password: params[:password])
        error!(@user.errors.messages, 400) unless @user.persisted?

        token = @user.login(params[:password])
        if token
          crypto_key = @user.crypto_key(params[:password])
          present @user, with: Entities::User, token: token, crypto_key: crypto_key
        else
          error!('Invalid email or password', 401)
        end
      end

      desc 'Delete current user'
      params do
        optional :password, type: String, desc: 'password'
      end
      delete :delete do
        error!('Incorrect password', 401) unless current_user.authenticate(params[:password])
        error!(current_user.errors.messages, 400) unless current_user.destroy

        status :no_content
      end
    end
  end
end
