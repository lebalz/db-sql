# frozen_string_literal: true

module Entities
  class DbServer < Grape::Entity
    expose :id
    expose :user_id
    expose :name
    expose :db_type
    expose :host
    expose :port
    expose :username
    expose :password_encrypted
    expose :initialization_vector
    expose :initial_db
    expose :initial_table
    expose :query_count
    expose :error_query_count
    expose :database_schema_query_id
    expose :created_at
    expose :updated_at
  end
end
