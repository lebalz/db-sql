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

  desc "startup test databases"
  task start_dbs: :environment do
    puts `docker-compose -f #{Rails.root.join('spec', 'docker-compose.yml')} up -d`
  end

  desc "checks if the test databases are running"
  task check_dbs_running: :environment do
    # wait until all database services are started up
    [5009, 5010, 5011, 5012, 3356, 3357, 3380].each do |port|
      Socket.tcp('127.0.0.1', port, connect_timeout: 5) do
        true
      end
    rescue StandardError
      puts "Could not find running databases on ports 5009, 5010, 5011, 5012, 3356, 3357, 3380."
      puts "Start dbs with 'rake db:start_dbs'"
      puts "or disable the check by setting 'SKIP_DB=1'"
      exit 1
    end
    puts "running"
  end

  desc "stop test databases"
  task stop_dbs: :environment do
    puts `docker-compose -f #{Rails.root.join('spec', 'docker-compose.yml')} down`
  end
end
