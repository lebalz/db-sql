# frozen_string_literal: true

module Entities

  class GroupUser < Grape::Entity
    expose :id
    expose :email
  end

  class GroupMember < Grape::Entity
    expose :is_admin
    expose :is_outdated
    expose :group_id
    expose :user, with: Entities::GroupUser
    expose :created_at
    expose :updated_at
  end
end
