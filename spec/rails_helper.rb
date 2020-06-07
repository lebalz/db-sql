# frozen_string_literal: true

# This file is copied to spec/ when you run 'rails generate rspec:install'
require 'rake'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../config/environment', __dir__)
# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'
# Add additional requires below this line. Rails is not loaded until this point!
require 'spec_helper'
Rails.application.load_tasks

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
# The following line is provided for convenience purposes. It has the downside
# of increasing the boot-up time by auto-requiring all files in the support
# directory. Alternatively, in the individual `*_spec.rb` files, manually
# require only the support files necessary.
#
# Dir[Rails.root.join('spec', 'support', '**', '*.rb')].each { |f| require f }

# Checks for pending migrations and applies them before tests are run.
# If you are not using ActiveRecord, you can remove these lines.
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  puts e.to_s.strip
  exit 1
end
INTEGRATION_FEATURE_TEST_REGEXP = /\/integration|features\//i.freeze

RSpec.configure do |config|
  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  config.include FactoryBot::Syntax::Methods

  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:transaction)

    if DatabaseSchemaQuery.default(:psql).nil?
      FactoryBot.create(
        :database_schema_query,
        db_type: :psql,
        is_default: true,
        name: 'psql'
      )
    end
    if DatabaseSchemaQuery.default(:mysql).nil?
      FactoryBot.create(
        :database_schema_query,
        db_type: :mysql,
        is_default: true,
        name: 'mysql'
      )
    end
    if DatabaseSchemaQuery.default(:mariadb).nil?
      FactoryBot.create(
        :database_schema_query,
        db_type: :mariadb,
        is_default: true,
        name: 'mariadb'
      )
    end
    # only start spec dbs when integration or feature tests are requested
    if config.files_to_run.any? { |f| f.match(INTEGRATION_FEATURE_TEST_REGEXP) }
      Rake::Task['db:start_spec_dbs'].invoke unless ENV['SKIP_DB']
    end
  end
  config.before(:all) do
    DatabaseCleaner.start
  end
  config.after(:all) do
    DatabaseCleaner.clean
    FileUtils.rm_rf(Rails.root.join('tmp', 'storage'))
  end
  config.after(:suite) do
    DatabaseSchemaQuery.default(:psql)&.send(:force_destroy!)
    DatabaseSchemaQuery.default(:mysql)&.send(:force_destroy!)
    # only shut down spec dbs when integration or feature tests were run
    if config.files_to_run.any? { |f| f.match(INTEGRATION_FEATURE_TEST_REGEXP) }
      Rake::Task['db:stop_spec_dbs'].invoke unless ENV['KEEP_DBS_RUNNING']
    end
  end

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/controllers`.
  #
  # You can disable this behaviour by removing the line below, and instead
  # explicitly tag your specs with their type, e.g.:
  #
  #     RSpec.describe UsersController, :type => :controller do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://relishapp.com/rspec/rspec-rails/docs
  config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.filter_rails_from_backtrace!
  # arbitrary gems may also be filtered via:
  # config.filter_gems_from_backtrace("gem name")
end
