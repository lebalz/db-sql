# frozen_string_literal: true

module Entities
  class ColumnSqlTypeMetadata < Grape::Entity
    with_options(expose_nil: false) do
      expose :limit
      expose :precision
      expose :scale
      expose :sql_type
      expose :type
    end
  end
  class Column < Grape::Entity
    with_options(expose_nil: false) do
      expose :name
      expose :collation
      expose :default
      expose :default_function
      expose :null
      expose :serial
      expose :sql_type_metadata, using: Entities::ColumnSqlTypeMetadata
    end
    expose :is_primary do |column, options|
      options[:primary_keys].include?(column[:name])
    end
  end
end
