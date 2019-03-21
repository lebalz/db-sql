module Entities
  class DbConnection < Grape::Entity
    expose :id
    expose :user_id
    expose :name
    expose :db_type
    expose :host
    expose :port
    expose :password_encrypted
    expose :initialization_vector
    expose :initial_db
    expose :initial_schema
    expose :created_at
  end
end