# frozen_string_literal: true

module Entities
  class SqlQuery < Grape::Entity
    with_options(expose_nil: false) do
      expose :id
      expose :user_id
      expose :db_server_id
      expose :db_name

      expose :query
      expose :is_private
      expose :is_favorite
      expose :is_valid
      expose :created_at
      expose :updated_at
    end
  end
end
