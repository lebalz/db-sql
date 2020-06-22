# frozen_string_literal: true

module Entities
  class Group < Grape::Entity
    with_options(expose_nil: false) do
      expose :id
      expose :is_private
      expose :name
      expose :description
      expose :created_at
      expose :updated_at
      expose :members, with: Entities::GroupMember, if: lambda { |instance, options| instance.admin?(options[:user]) }
      expose :db_servers, with: Entities::DbServer
    end
  end
end
