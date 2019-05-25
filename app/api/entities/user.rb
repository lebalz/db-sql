module Entities
  class User < Grape::Entity
    format_with(:iso_timestamp) do |date|
      date.iso8601
    end

    expose :id
    expose :email
    expose :token do |_, options|
      options[:token]
    end
    expose :login_count
    expose :crypto_key do |_, options|
      options[:crypto_key]
    end
    with_options(format_with: :iso_timestamp) do
      expose :updated_at
      expose :created_at
    end
    expose :role
    expose :activated
  end
end