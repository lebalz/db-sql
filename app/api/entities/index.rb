# frozen_string_literal: true

module Entities
  class Index < Grape::Entity
    expose :table_name do |obj|
      obj[:table]
    end
    expose :name
    expose :unique
    expose :columns
    expose :using
    expose :lengths
    expose :orders
    expose :opclasses
    with_options(expose_nil: false) do
      expose :where
      expose :type
      expose :comment
      expose :db_server_id
      expose :database_name
    end
  end
end
