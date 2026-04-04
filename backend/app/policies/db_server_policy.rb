# frozen_string_literal: true

class DbServerPolicy < ApplicationPolicy
  def show?
    case record.owner_type
    when :user
      record.user_id == user.id
    when :group
      record.group.member?(user)
    end
  end

  def create?
    true
  end

  def update?
    case record.owner_type
    when :user
      record.user_id == user.id
    when :group
      record.group.admin?(user)
    end
  end

  def destroy?
    case record.owner_type
    when :user
      record.user_id == user.id
    when :group
      record.group.admin?(user)
    end
  end

  def index?
    true
  end

  class Scope < Scope

    # @return [ActiveRecord::Relation<DbServer>]
    def resolve
      scope.left_joins(:group)
           .joins('LEFT JOIN group_members ON groups.id = group_members.group_id')
           .where('db_servers.user_id = :user OR group_members.user_id = :user', user: user.id)
    end
  end
  end
