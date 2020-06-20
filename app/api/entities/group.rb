# frozen_string_literal: true

module Entities
  class Group < Grape::Entity
    with_options(expose_nil: false) do
      expose :id
      expose :is_private
      expose :name
      expose :created_at
      expose :members, with: Entities::GroupMember
      expose :db_servers, with: Entities::DbServer
    end
  end
end
