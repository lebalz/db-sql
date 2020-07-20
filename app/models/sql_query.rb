# frozen_string_literal: true

# == Schema Information
#
# Table name: sql_queries
#
#  id           :uuid             not null, primary key
#  db_name      :string
#  description  :string
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

  def valid_query?
    is_valid
  end

  def query
    @query ||= raw_query.attached? ? raw_query.blob.download : ''
  end

  def query=(value)
    @query = value
    self.raw_query.attach(
      io: StringIO.new(value),
      filename: "query_#{Time.now.to_i}.sql",
      content_type: 'text/plain'
    )
  end

  # @param user [User]
  def authorized?(user)
    return user_id == user.id if private?

    db_server.authorized?(user)
  end

  def private?
    is_private
  end

  def public?
    !is_private
  end
end
  
