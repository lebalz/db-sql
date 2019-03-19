# frozen_string_literal: true

module Resources
  class Login < Grape::API
    helpers do
      # generate a key to encrypt db passwords client side
      # @param password [String] clear text password. (Not stored in backend)
      def crypto_key(password)
        # OpenSSL::HMAC.hexdigest("SHA256", @user.id + password, password)
        Base64.strict_encode64(
          Digest::SHA256.digest(@user.id + password)
        )
      end
    end
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
        aes_key = crypto_key(params[:password])
        present @user, with: Entities::User, token: token, aes_key: aes_key
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