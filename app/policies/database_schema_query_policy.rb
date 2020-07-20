# frozen_string_literal: true

class DatabaseSchemaQueryPolicy < ApplicationPolicy
  def show?
    record.public? || record.author_id == user.id
  end

  def create?
    true
  end

  def update?
    record.author_id == user.id
  end

  def destroy?
    record.author_id == user.id
  end

  def change_default?
    user.admin?
  end

  def index?
    true
  end

  class Scope < Scope

    # @return [ActiveRecord::Relation<DbServer>]
    def resolve
      scope.where('(not database_schema_queries.is_private OR database_schema_queries.author_id = :author)', author: user.id)
    end
  end
  end
