# frozen_string_literal: true

class SqlQueryPolicy < ApplicationPolicy
  def show?
    record.public? || record.user_id == user.id
  end

  def create?
    true
  end

  def update?
    record.user_id == user.id || (
      record.db_server.owner_type == :group && record.db_server.owner.admin?(user)
    )
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
      scope.where('sql_queris.user_id = :author', author: user.id)
    end
  end
  end
