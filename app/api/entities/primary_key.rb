# frozen_string_literal: true

module Entities
  class PrimaryKey < Grape::Entity
    expose :primary_key
    with_options(expose_nil: false) do
      expose :db_server_id
      expose :database_name
      expose :table_name
    end
  end
end
