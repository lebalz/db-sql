# frozen_string_literal: true

module Entities
  class Table < Grape::Entity
    with_options(expose_nil: false) do
      expose :name
      expose :db_server_id
      expose :database_name
    end
  end
end
