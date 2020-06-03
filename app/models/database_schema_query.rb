# frozen_string_literal: true

# == Schema Information
#
# Table name: database_schema_queries
#
#  id          :uuid             not null, primary key
#  db_type     :integer          not null
#  description :string
#  is_default  :boolean          default(FALSE), not null
#  is_private  :boolean          default(FALSE), not null
#  name        :string           not null
#  query       :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  author_id   :uuid             not null
#
# Indexes
#
#  index_database_schema_queries_on_author_id  (author_id)
#
# Foreign Keys
#
#  fk_rails_...  (author_id => users.id)
#
class DatabaseSchemaQuery < ApplicationRecord
  has_many :db_servers
  belongs_to :author, class_name: 'User', inverse_of: :database_schema_queries

  enum db_type: DbServer::DB_TYPES
  validate :only_one_default_by_db_type
  validate :check_not_referenced_when_private
  before_destroy :assert_not_default
  before_destroy :assert_not_referenced

  # @param db_type [DbServer::DB_TYPES], e.g :mysql or :psql
  # @return [DatabaseSchemaQuery]
  def self.default(db_type)
    DatabaseSchemaQuery.where(db_type: db_type, is_default: true).first
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
      name: name,
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

  def check_not_referenced_when_private
    return if public?
    return if db_servers.count.zero?
    return if db_servers.all? { |db_server| db_server.user === author }

    errors.add(
      :database_schema_query,
      "An already referenced database schema query can not be made private."
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
