# frozen_string_literal: true

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
        requires(:old_password, type: String, desc: 'old password')
        requires(:new_password, type: String, desc: 'new password')
        requires(
          :password_confirmation,
          type: String,
          desc: 'new password confirmation'
        )
      end
      post :new_password do
        authenticated = current_user.authenticate(params[:old_password])
        error!('Incorrect old password', 403) unless authenticated

        is_confirmed = params[:new_password] == params[:password_confirmation]
        error!('Password confirmation failed', 400) unless is_confirmed
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
          error!('Failed to update password', 400)
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
        ActivationMailer.activate_account(@user).deliver_now
        token = @user.login(params[:password])
        if token
          crypto_key = @user.crypto_key(params[:password])
          present(
            @user,
            with: Entities::User,
            token: token,
            crypto_key: crypto_key
          )
        else
          error!('Invalid email or password', 401)
        end
      end

      route_setting :auth, disabled: true
      params do
        requires :email, type: String
      end
      post :reset_password do
        logout_existing_user
        @user = User.find_by(email: params[:email])
        error!('No user found with this email', 400) unless @user

        @user.request_password_reset
        ResetPasswordMailer.reset(@user).deliver_now
      end

      post :resend_activation_link do
        user = current_user.reset_activation_digest
        if user
          ActivationMailer.activate_account(user).deliver_now
        else
          error!('Could not resend activation link', 400)
        end
      end

      route_param :id, type: String, desc: 'Id of a user' do
        route_setting :auth, disabled: true
        desc 'Activate a useraccount'
        params do
          requires :activation_token, type: String
        end
        put :activate do
          user = User.find(params[:id])
          return error!('Invalid activation link', 400) unless user

          return status(:no_content) if user.activated?

          activated = user.activate(params[:activation_token])
          error!('Invalid activation link', 400) unless activated
          status :no_content
        end

        route_setting :auth, disabled: true
        desc 'Reset password'
        params do
          requires :reset_token, type: String
        end
        get :reset_password do
          user = User.find(params[:id])
          reset_requested = user&.reset_password_digest &&
            user&.reset_password_mail_sent_at

          error!('Invalid link', 400) unless reset_requested
          expired = DateTime.now >= user.reset_password_mail_sent_at + 12.hours
          error!('The reset link is outdated, request a new one.') if expired

          token = params[:reset_token]
          valid = BCrypt::Password.new(user.reset_password_digest)
                                  .is_password?(token)
          error!('Invalid reset token', 403) unless valid

          redirect "/reset_password/#{user.id}?reset_token=#{token}"
        end

        route_setting :auth, disabled: true
        desc 'Reset password'
        params do
          requires :reset_token, type: String
          requires :password, type: String
          requires :password_confirmation, type: String
        end
        post :reset_password do
          user = User.find(params[:id])
          error!('Invalid link', 400) unless user
          user.reset_password!(
            reset_token: params[:reset_token],
            password: params[:password],
            password_confirmation: params[:password_confirmation]
          )
          error!(user.errors[:base].first, 400) unless user.errors[:base].empty?
          redirect '/login'
        end
      end

      desc 'Delete current user'
      params do
        # requires :data, type: Hash do
        requires :password, type: String, desc: 'password'
        # end
      end
      delete do
        authenticated = current_user.authenticate(params[:password])
        error!('Incorrect password', 403) unless authenticated
        error!(current_user.errors.messages, 400) unless current_user.destroy

        status :no_content
      end
    end
  end
end
