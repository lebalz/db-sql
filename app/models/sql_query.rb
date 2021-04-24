# frozen_string_literal: true

# == Schema Information
#
# Table name: sql_queries
#
#  id           :uuid             not null, primary key
#  db_name      :string
#  error        :json
#  exec_time    :float
#  is_favorite  :boolean          default(FALSE)
#  is_private   :boolean          default(TRUE)
#  is_valid     :boolean          default(FALSE)
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  db_server_id :uuid             not null
#  user_id      :uuid             not null
#
# Indexes
#
#  index_sql_queries_on_db_server_id  (db_server_id)
#  index_sql_queries_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (db_server_id => db_servers.id)
#  fk_rails_...  (user_id => users.id)
#
class SqlQuery < ApplicationRecord
  belongs_to :db_server
  belongs_to :user

  has_one_attached :raw_query
  after_create :cleanup_outdated_queries

  QUERY_COUNT_PER_SERVER_AND_USER = 100

  def valid_query?
    is_valid
  end

  def query
    @query ||= raw_query.attached? ? raw_query.blob.download : ''
  end

  # @param query_index [int] 0 based
  # @param msg [string]
  def add_error(query_index:, msg:)
    self.error ||= []
    self.error << {query_index: query_index, error: msg}
  end

  def query=(value)
    @query = value
    raw_query.purge if raw_query.attached?
    raw_query.attach(
      io: StringIO.new(value),
      filename: "query_#{Time.now.to_i}.sql",
      content_type: 'text/plain'
    )
  end

  def private?
    is_private
  end

  def public?
    !is_private
  end

  def favorite?
    is_favorite
  end

  private

  def cleanup_outdated_queries
    queries = SqlQuery.where(user: user, db_server: db_server)
    return if queries.count <= QUERY_COUNT_PER_SERVER_AND_USER

    to_delete = queries.order('is_favorite desc',
                              'created_at desc').offset(QUERY_COUNT_PER_SERVER_AND_USER)
    to_delete.destroy_all
  end
end
