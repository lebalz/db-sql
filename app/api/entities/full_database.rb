# frozen_string_literal: true

module Entities
  class DbConstraints < Grape::Entity
    expose :name
    expose :database
    expose :schema
    expose :table
    expose :column
  end

  class SqlMetadata < Grape::Entity
    expose :type
    expose :limit
    expose :precision
    expose :scale
    expose :sql_type
  end

  class DbColumn < Grape::Entity
    expose :name
    expose :position
    expose :null
    expose :is_primary
    expose :is_foreign
    expose :default
    expose :sql_type_metadata, using: Entities::SqlMetadata
    expose :constraints, using: Entities::DbConstraints
  end


  class DbTable < Grape::Entity
    expose :name
    expose :columns, using: Entities::DbColumn
  end

  class DbSchema < Grape::Entity
    expose :name
    expose :tables, using: Entities::DbTable
  end

  class FullDatabase < Grape::Entity
    with_options(expose_nil: false) do
      expose :name
      expose :db_server_id
      expose :schemas, using: Entities::DbSchema
    end
  end
end
