# frozen_string_literal: true

class SeedDatabaseSchemaQueries
  def self.perform
    %i[mysql psql].each do |db_type|
      DatabaseSchemaQuery.create!(
        db_type: db_type,
        default: true,
        author: User.first
      )
      file = Rails.root.join('lib/queries', db_type.to_s, 'database_schema.sql')
      DatabaseSchemaQuery.default(db_type).file.attach(
        io: File.open(file),
        filename: "database_schema_#{db_type}.sql",
        content_type: 'text/plain'
      )
      sleep(1)
    end
  end
end
