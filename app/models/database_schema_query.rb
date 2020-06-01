# frozen_string_literal: true

# == Schema Information
#
# Table name: database_schema_queries
#
#  id                   :uuid             not null, primary key
#  db_type              :integer          not null
#  is_default           :boolean          default(FALSE), not null
#  is_private           :boolean          default(FALSE), not null
#  query                :string           not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  author_id            :uuid             not null
#  previous_revision_id :uuid
#
# Indexes
#
#  index_database_schema_queries_on_author_id             (author_id)
#  index_database_schema_queries_on_previous_revision_id  (previous_revision_id)
#
# Foreign Keys
#
#  fk_rails_...  (author_id => users.id)
#  fk_rails_...  (previous_revision_id => database_schema_queries.id)
#
class DatabaseSchemaQuery < ApplicationRecord
  has_many :db_servers
  belongs_to :author, class_name: 'User', inverse_of: :database_schema_queries
  belongs_to :previous_revision, class_name: 'DatabaseSchemaQuery', optional: true
  has_many :revisions, class_name: 'DatabaseSchemaQuery', foreign_key: 'previous_revision_id'

  enum db_type: DbServer::DB_TYPES
  validate :only_one_default_by_db_type
  before_destroy :assert_not_default
  before_destroy :assert_not_referenced

  # @param db_type [DbServer::DB_TYPES], e.g :mysql or :psql
  # @return [DatabaseSchemaQuery]
  def self.default(db_type)
    DatabaseSchemaQuery.where(db_type: db_type, is_default: true).first
  end

  def self.latest_revisions(author_id: nil, db_type: DbServer::DB_TYPES)
    DatabaseSchemaQuery.where('is_private=false OR author_id=?', author_id)
                       .where(db_type: db_type)
                       .where.not(
                         id: DatabaseSchemaQuery.where.not(
                           previous_revision_id: nil
                         ).pluck(:previous_revision_id)
                       )
                       .or(DatabaseSchemaQuery.where(is_default: true, db_type: db_type))
                       .order(is_default: :desc, created_at: :desc)
  end

  def previous_revisions
    [previous_revision, *previous_revision&.previous_revisions].compact
  end

  def newer_revisions
    revisions.map do |rev|
      [rev, *rev.newer_revisions].compact
    end.flatten
  end

  def revision_tree
    [*previous_revisions, self, *newer_revisions].compact
  end

  def default?
    is_default
  end

  def private?
    is_private
  end

  def public?
    !private?
  end

  # @return [String] the content of the attached query
  def to_s
    query
  end

  def clone
    DatabaseSchemaQuery.create(
      db_type: db_type,
      is_default: false,
      is_private: is_private,
      query: query,
      author_id: author_id
    )
  end

  def make_default!
    return if default?

    ActiveRecord::Base.transaction do
      current_default = DatabaseSchemaQuery.default(db_type)
      refs = current_default&.db_servers
      current_default&.update!(is_default: false)
      update!(is_default: true)
      refs&.each do |ref|
        ref.update!(database_schema_query: self)
      end
    end
  end

  private

  # ignores the validation and destroys a default database_schema_query
  # For development purposes only, use with caution
  def force_destroy!
    sql = ActiveRecord::Base.sanitize_sql(
      ['DELETE FROM database_schema_queries WHERE id = ?', id]
    )
    ActiveRecord::Base.connection.execute(sql)
  end

  def only_one_default_by_db_type
    return unless default?
    return if DatabaseSchemaQuery.default(db_type).nil?
    return if DatabaseSchemaQuery.default(db_type) == self

    errors.add(
      :default_database_schema_query,
      "A default query for '#{db_type}' is already set."
    )
  end

  def assert_not_default
    return true unless default?

    errors.add :base, "Cannot delete the default database schema query"
    throw(:abort)
  end

  def assert_not_referenced
    return true if private?
    return true if db_servers.count.zero?

    errors.add :base, "Cannot delete a database schema query which is referenced"
    throw(:abort)
  end

end
