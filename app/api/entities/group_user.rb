# frozen_string_literal: true

module Entities

  class GroupUser < Grape::Entity
    expose :id
    expose :email
  end
end
