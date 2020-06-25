# frozen_string_literal: true

Oj.optimize_rails

class API < Grape::API

  # Strings from Redis don't need to be serialized.
  # In return we must guarantee that strings directly returned in grape
  # endpoints are valid JSON (--> call #to_json)
  module JsonFormatter
    def self.call(obj, _env)
      return obj if obj.is_a?(String)

      MultiJson.dump(obj)
    end
  end

  format :json
  default_format :json
  formatter :json, JsonFormatter

  include ErrorHandling

  # This before block has to be run after the route error handling blocks
  before do
    header['Access-Control-Allow-Origin'] = '*'
    http_methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD'
    header['Access-Control-Allow-Methods'] = http_methods
    header['Access-Control-Allow-Headers'] = '*'
    header['Access-Control-Request-Method'] = '*'
    disabled_auth = route.settings.dig(:auth, :disabled)
    authenticate unless disabled_auth
  end
  helpers do
    def authenticate
      token = request.headers['Authorization']
      error!('No login token sent', 401) unless token

      login_token = LoginToken.find_by(token: token)
      error!('Invalid login token', 401) unless login_token

      if login_token.expired?
        login_token.destroy
        error!('Login token expired', 401)
      else
        @current_user = login_token.user
        if @current_user.activation_expired?
          error!('Activate your account', 403)
        end
      end
      @current_user
    end

    attr_reader :current_user
  end

  mount Resources::Login
  mount Resources::Users
  mount Resources::DbServers
  mount Resources::Admin
  mount Resources::TempDbServer
  mount Resources::Status
  mount Resources::DatabaseSchemaQueries
  mount Resources::Groups

  # This needs to happen at the very end of this file.
  add_swagger_documentation(
    info: {
      title: "DB SQL"
    }
  )
end
