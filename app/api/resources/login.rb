# frozen_string_literal: true

module Resources
  class Login < Grape::API
    route_setting :auth, disabled: true
    params do
      requires :email, type: String
      requires :password, type: String
    end
    post :login do
      @user = User.find_by(email: params[:email].downcase)
      error!('Invalid email or password', 401) unless @user
      error!('Activate your account', 403) if @user.activation_expired?

      token = @user.login(params[:password])
      error!('Invalid email or password', 401) unless token

      crypto_key = @user.crypto_key(params[:password])
      present(
        @user,
        with: Entities::User,
        token: token,
        crypto_key: crypto_key
      )
    end

    post :logout do
      token = request.headers['Authorization']
      current_user.logout(token)

      status :no_content
    end
  end
end
