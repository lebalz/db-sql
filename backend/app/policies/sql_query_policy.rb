# frozen_string_literal: true

class SqlQueryPolicy < ApplicationPolicy
  def show?
    return true if record.user_id == user.id
    return false unless record.public?
    return false unless record.db_server.owner_type == :group

    record.db_server.owner.member? user
  end

  def create?
    true
  end

  def update?
    return true if record.user_id == user.id
    return false unless record.db_server.owner_type == :group
    record.db_server.owner.admin? user
  end

  def destroy?
    user.admin?
  end

  def index?
    true
  end

  class Scope < Scope

    # @return [ActiveRecord::Relation<DbServer>]
    def resolve
      scope.where(user: user)
    end
  end
end
