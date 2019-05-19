module Resources
  class Users < Grape::API
    resource :user do
      desc 'Get current user'
      get do
        present current_user, with: Entities::User
      end

      desc 'Set new password'
      params do
        requires :old_password, type: String, desc: 'old password'
        requires :new_password, type: String, desc: 'new password'
        requires :password_confirmation, type: String, desc: 'new password confirmation'
      end
      post :new_password do
        error!('Incorrect old password', 302) unless current_user.authenticate(params[:old_password])

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
    end
  end
end
