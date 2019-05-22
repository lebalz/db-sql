Oj.optimize_rails

class API < Grape::API


  # Strings from Redis don't need to be serialized.
  # In return we must guarantee that strings directly returned in grape
  # endpoints are valid JSON (--> call #to_json)
  module JsonFormatter
    def self.call(obj, _env)
      if obj.is_a?(String)
        return obj
      end

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
    header['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD'
    header['Access-Control-Allow-Headers'] = '*'
    header['Access-Control-Request-Method'] = '*'
    authenticate unless route.settings[:auth] && route.settings[:auth][:disabled]
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
      end
    end

    def current_user
      @current_user
    end
  end

  mount Resources::Login
  mount Resources::Users
  mount Resources::DbConnections
  mount Resources::Admin

  # This needs to happen at the very end of this file.
  add_swagger_documentation(
    info: {
      title: "DB SQL"
    }
  )
end