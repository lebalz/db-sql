module Entities
  class User < Grape::Entity
    expose :id
    expose :email
    expose :token do |user, _|
      user.login_tokens.order(:updated_at).last.token
    end
    expose :last_login do |user, _|
      user.login_tokens.order(:updated_at).last.updated_at
    end
    expose :created_at
  end
end