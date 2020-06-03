# frozen_string_literal: true

module Entities
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
    end
  end
end
