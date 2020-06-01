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
require 'rails_helper'

RSpec.describe DatabaseSchemaQuery, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
