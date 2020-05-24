# frozen_string_literal: true

namespace :db do
  desc "migrate database to use database_schema_query"
  task migrate_20200523222631_create_database_schema_queries: :environment do
    ActiveRecord::Base.transaction do
      seed_schema_queries = DatabaseSchemaQuery.default(db_type: :psql).nil?
      SeedDatabaseSchemaQueries.perform if seed_schema_queries

      DbServer.all.each do |db_server|
        next unless db_server.database_schema_query.nil?

        default = DatabaseSchemaQuery.default(db_type: db_server.db_type)
        db_server.update!(
          database_schema_query: default
        )
        puts "updated database schema query for db server #{db_server.id}"
      end
    end
    puts "done"
    exit
  end
end
