# frozen_string_literal: true
require_relative '../../lib/queries/query'

class SeedDatabaseSchemaQueries
  def self.perform
    %i[psql mysql mariadb].each do |db_type|
      file = Rails.root.join(query_path(db_type: db_type), 'database_schema.sql')
      DatabaseSchemaQuery.create!(
        name: db_type.upcase,
        db_type: db_type,
        is_default: true,
        author: User.first,
        query: File.read(file)
      )
    end
  end
end
