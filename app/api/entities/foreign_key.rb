# frozen_string_literal: true

module Entities
  class ForeignKeyOptions < Grape::Entity
    with_options(expose_nil: false) do
      expose :column
      expose :name
      expose :primary_key
      expose :on_update
      expose :on_delete
    end
  end
  class ForeignKey < Grape::Entity
    expose :from_table
    expose :to_table
    expose :options, using: Entities::ForeignKeyOptions
  end
end
