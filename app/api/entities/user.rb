module Entities
  class User < Grape::Entity
    expose :id
    expose :email
    expose :token do |_, options|
      options[:token]
    end
    expose :last_login do |user, _|
      user.login_tokens.order(:updated_at).last.updated_at
    end
    expose :aes_key do |_, options|
      options[:aes_key]
    end
    expose :created_at
  end
end