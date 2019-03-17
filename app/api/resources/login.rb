# frozen_string_literal: true

module Resources
  class Login < Grape::API
    route_setting :auth, disabled: true
    params do
      requires :email, type: String
      requires :password, type: String
    end
    post :login do
      @user = User.find_by(email: params[:email])
      (error!('Invalid email or password', 401) unless @user)

      token = @user.login(params[:password])

      if token
        present @user, with: Entities::User, token: token
      else
        error!('Invalid email or password', 401)
      end
    end

    post :logout do
      token = request.headers['Authorization']
      current_user.logout(token)

      status :no_content
    end
  end
end