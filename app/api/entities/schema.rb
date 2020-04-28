# frozen_string_literal: true

module Entities
  class Schema < Grape::Entity
    with_options(expose_nil: false) do
      expose :name
      expose :db_server_id
    end
  end
end
