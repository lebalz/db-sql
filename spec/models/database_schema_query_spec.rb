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
require 'rails_helper'

RSpec.describe DatabaseSchemaQuery, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
