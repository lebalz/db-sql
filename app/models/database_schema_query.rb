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

  # @return [Array<Hash>] all revisions appearing in the history
  #   (past and future) of this record
  # @example
  # [
  #   {
  #     "id"=>"709088ac-e9ab-41c1-bf80-4cdc50bb0431",
  #     "db_type"=>0,
  #     "is_default"=>false,
  #     "is_private"=>false,
  #     "author_id"=>"06376e09-ba1a-4f9e-b0a6-37043ec9e9c4",
  #     "previous_revision_id"=>"7c18b8db-5f79-45ac-9dc6-5c40aea2b4e6",
  #     "query"=>"SELECT * ...",
  #     "created_at"=>"2020-05-31 08:41:52.139893",
  #     "updated_at"=>"2020-05-31 08:42:41.935546",
  #     "position"=>-1,
  #     "next_revision_ids"=>["781da86a-916f-4b53-962d-72a58bb2f0a2"]
  #   },
  #   {
  #     "id"=>"781da86a-916f-4b53-962d-72a58bb2f0a2",
  #     "db_type"=>0,
  #     "is_default"=>false,
  #     "is_private"=>false,
  #     "author_id"=>"06376e09-ba1a-4f9e-b0a6-37043ec9e9c4",
  #     "previous_revision_id"=>"709088ac-e9ab-41c1-bf80-4cdc50bb0431",
  #     "query"=>"SELECT * FROM FOO...",
  #     "created_at"=>"2020-05-31 08:47:09.031981",
  #     "updated_at"=>"2020-05-31 08:47:09.101699",
  #     "position"=>0,
  #     "next_revision_ids"=>[]
  #   }
  # ]

  def revisions
    ActiveRecord::Base.connection.execute(
      <<-SQL
        (WITH RECURSIVE previous_revs AS (
            SELECT #{DatabaseSchemaQuery.table_name}.*, 0 AS position, '{}'::TEXT[] AS next_revision_ids FROM #{DatabaseSchemaQuery.table_name}
            WHERE #{DatabaseSchemaQuery.table_name}.id = '#{id}'
            UNION ALL
              SELECT #{DatabaseSchemaQuery.table_name}.*, previous_revs.position - 1, next_revision_ids || previous_revs.id::TEXT
              FROM #{DatabaseSchemaQuery.table_name}, previous_revs
              WHERE #{DatabaseSchemaQuery.table_name}.id = previous_revs.previous_revision_id
        ) SELECT * FROM previous_revs WHERE id != '#{id}')
        UNION ALL
        (WITH RECURSIVE new_revs AS (
            SELECT #{DatabaseSchemaQuery.table_name}.*, 0 AS position, '{}'::TEXT[] AS next_revision_ids FROM #{DatabaseSchemaQuery.table_name}
            WHERE #{DatabaseSchemaQuery.table_name}.id = '#{id}'
            UNION ALL
              SELECT #{DatabaseSchemaQuery.table_name}.*, new_revs.position + 1, next_revision_ids || new_revs.id::TEXT
              FROM #{DatabaseSchemaQuery.table_name}, new_revs
              WHERE #{DatabaseSchemaQuery.table_name}.previous_revision_id = new_revs.id
        ) SELECT * FROM new_revs)
        ORDER BY position ASC
      SQL
    ).to_a.map do |row|
      row.merge(
        "next_revision_ids" => row['next_revision_ids'][1..-2].split(',')
      )
    end
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
