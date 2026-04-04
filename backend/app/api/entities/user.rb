# frozen_string_literal: true

module Entities
  class User < Grape::Entity
    # format timestamps in iso8601 format,
    # e.g. 2019-05-28T19:49:02Z means 28.05.2019 at 19:49:02 in timezone 0 (=Z)
    format_with(:iso_timestamp, &:iso8601)

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
    expose :activated do |user|
      user.activated?
    end
    expose :query_count do |user|
      user.query_count
    end
    expose :error_query_count do |user|
      user.error_query_count
    end
    expose :password_reset_requested do |user|
      user.password_reset_requested?
    end
  end
end
