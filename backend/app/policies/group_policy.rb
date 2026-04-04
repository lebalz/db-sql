# frozen_string_literal: true

class GroupPolicy < ApplicationPolicy
  def show?
    return true if record.public?

    record.member? user
  end

  def create?
    true
  end

  def join?
    record.public?
  end

  def leave?
    record.public?
  end

  def update?
    record.admin?(user)
  end

  def destroy?
    record.admin?(user)
  end

  def add_member?
    return true if record.public?

    record.admin?(user)
  end

  def add_db_server?
    record.admin?(user)
  end

  def leave?
    return true if record.public?
    return false unless record.admin? user

    return true if record.admins.size > 1
    return true if record.members.size == 1
    false
  end

  def remove_member?
    record.admin?(user)
  end

  def recrypt?
    record.admin?(user)
  end

  def change_member_permission?
    record.admin?(user)
  end

  def index?
    true
  end

  class Scope < Scope

    # @return [ActiveRecord::Relation<DbServer>]
    def resolve
      scope.all if user.admin?

      my_groups = GroupMember.select(:group_id).where(user: user).to_sql

      scope.where(
        "not groups.is_private or groups.id in (#{my_groups})"
      )
    end
  end
end
