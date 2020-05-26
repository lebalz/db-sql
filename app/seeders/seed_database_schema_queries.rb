# frozen_string_literal: true

class SeedDatabaseSchemaQueries
  def self.perform
    %i[psql mysql].each do |db_type|
      file = Rails.root.join('lib/queries', db_type.to_s, 'database_schema.sql')
      DatabaseSchemaQuery.create!(
        db_type: db_type,
        default: true,
        author: User.first,
        query: File.read(file)
      )
    end
  end
end
