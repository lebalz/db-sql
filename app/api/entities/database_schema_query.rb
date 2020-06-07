# frozen_string_literal: true

module Entities
  class DatabaseSchemaqQueryStats < Grape::Entity
    expose :public_user_count
    expose :reference_count
  end
  class DatabaseSchemaQuery < Grape::Entity
    with_options(expose_nil: false) do
      expose :id
      expose :name
      expose :description
      expose :db_type
      expose :is_default
      expose :is_private
      expose :query
      expose :created_at
      expose :updated_at
      expose :author_id
      expose :stats, with: Entities::DatabaseSchemaqQueryStats
    end

  end
end
