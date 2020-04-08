# frozen_string_literal: true

module Entities
  class FullTable < Grape::Entity
    expose :name
    expose :columns, using: Entities::Column
    expose :indices, using: Entities::Index
    expose :foreign_keys, using: Entities::ForeignKey
  end

  class FullDatabase < Grape::Entity
    with_options(expose_nil: false) do
      expose :name
      expose :db_server_id
      expose :tables, using: Entities::FullTable
    end
  end
end
