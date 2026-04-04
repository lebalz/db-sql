# frozen_string_literal: true

module Entities
  class Database < Grape::Entity
    with_options(expose_nil: false) do
      expose :name
      expose :db_server_id
    end
  end
end
