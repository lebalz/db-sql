# frozen_string_literal: true

module Entities
  class DatabaseSchemaQuery < Grape::Entity
    with_options(expose_nil: false) do
      expose :id
      expose :db_type
      expose :is_default
      expose :is_latest do |instance|
        instance.revisions.empty?
      end
      expose :next_revision_ids do |instance|
        instance.revisions.pluck(:id)
      end
      expose :is_private
      expose :query
      expose :created_at
      expose :updated_at
      expose :author_id
      expose :previous_revision_id
    end
  end
end
