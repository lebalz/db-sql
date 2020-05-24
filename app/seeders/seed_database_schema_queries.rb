# frozen_string_literal: true

class SeedDatabaseSchemaQueries
  def self.perform
    %i[mysql psql].each do |db_type|
      schema_query = DatabaseSchemaQuery.create!(
        db_type: db_type,
        default: true,
        author: User.first
      )
      file = Rails.root.join('lib/queries', db_type.to_s, 'database_schema.sql')
      success = schema_query.query.attach(
        io: File.open(file),
        filename: "database_schema.sql",
        content_type: 'text/plain'
      )
      if success
        puts "Seeded database schema query for '#{db_type}'"
      else
        puts "Failed to attach database schema query file for '#{db_type}'"
      end
    end
  end
end
