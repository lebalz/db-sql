# frozen_string_literal: true

module Entities
  class GroupMember < Grape::Entity
    expose :is_admin
    expose :is_outdated
    expose :user_id
    expose :created_at
    expose :updated_at
  end
end
