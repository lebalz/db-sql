# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def show?
    user.admin? || user.id == record.id
  end

  def create?
    true
  end

  def update?
    user.admin? || user.id == record.id
  end

  def set_password?
    record.id == user.id
  end

  def destroy?
    if user.admin?
      user.id != record.id
    else
      user.id == record.id
    end
  end

  def index?
    user.admin?
  end

  def group_index?
    true
  end

  class Scope < Scope

    # @return [ActiveRecord::Relation<DbServer>]
    def resolve
      return scope.all if user.admin?

      scope.where('id = :user', user: user.id)
    end
  end
  end
