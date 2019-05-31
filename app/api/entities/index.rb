# frozen_string_literal: true

module Entities
  class Index < Grape::Entity
    expose :table
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
    end
  end
end
