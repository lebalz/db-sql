# frozen_string_literal: true

module Entities
  class Group < Grape::Entity
    with_options(expose_nil: false) do
      expose :id
      expose :is_private
      expose :name
      expose :created_at
      expose :users, with: Entities::User
      expose :db_servers, with: Entities::DbServer
      expose :admin_ids do |group|
        group.admins.map(&:id)
      end
      expose :outdated_user_ids do |group|
        group.outdated_user_groups.map(&:user_id)
      end
    end

  end
end
