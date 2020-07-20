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
      scope.where('db_servers.user_id = :author', author: user.id)
    end
  end
  end
