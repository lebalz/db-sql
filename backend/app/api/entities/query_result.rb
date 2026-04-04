# frozen_string_literal: true

module Entities
  class QueryResult < Grape::Entity
    with_options(expose_nil: false) do
      expose :result
      expose :limit_reached
      expose :error
      expose :time
      expose :state
      expose :query_id
    end
  end
end
