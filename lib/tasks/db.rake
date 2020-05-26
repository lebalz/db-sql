# frozen_string_literal: true

namespace :db do
  desc "migrate database to use database_schema_query"
  task migrate_20200523222631_create_database_schema_queries: :environment do
    ActiveRecord::Base.transaction do
      seed_schema_queries = DatabaseSchemaQuery.default(:psql).nil?
      SeedDatabaseSchemaQueries.perform if seed_schema_queries

      DbServer.all.each do |db_server|
        next unless db_server.database_schema_query.nil?

        default = DatabaseSchemaQuery.default(db_server.db_type)
        db_server.update!(
          database_schema_query: default
        )
        puts "updated database schema query for db server #{db_server.id}"
      end
    end
    puts "done"
    exit
  end

  desc 'update database schema query of default db types'
  task update_default_schema_queries: :environment do
    %i[psql mysql].each do |db_type|
      schema_query = DatabaseSchemaQuery.default(db_type)
      next if schema_query.nil?

      file = Rails.root.join('lib/queries', db_type.to_s, 'database_schema.sql')
      schema_query.update!(query: File.read(file))
    end
  end

  desc "startup test databases"
  task start_spec_dbs: :environment do
    puts `docker-compose -f #{Rails.root.join('spec', 'docker-compose.yml')} up -d`
    %w[postgres9 postgres10 postgres11 postgres12].each do |service|
      print "Waiting for #{service} to start"
      retries = 0
      until system("docker exec -it spec_#{service}_1 su postgres -c 'psql -c \"SELECT version();\"'", :out => File::NULL)
        retries += 1
        print '.'
        sleep(1)
        exit(1) if retries > 60
      end
      puts " --> running"
    end
    %w[mysql5_6 mysql5_7 mysql8].each do |service|
      print "Waiting for #{service} to start"
      retries = 0
      until system("docker exec -it spec_#{service}_1 mysql -u root --password=safe-db-password -e 'SELECT version();'", :out => File::NULL)
        retries += 1
        print '.'
        sleep(1)
        exit(1) if retries > 60
      end
      puts " --> running"
    end
  end

  desc "checks if the test databases are running"
  task check_spec_db_containers_running: :environment do
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
  task stop_spec_dbs: :environment do
    puts `docker-compose -f #{Rails.root.join('spec', 'docker-compose.yml')} down`
  end
end
