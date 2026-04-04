source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '4.0.2'

gem 'rails', '~> 8.1.3'
gem 'pg', '~> 1.5'
gem 'mysql2', '~> 0.5'

# Use Puma as the app server
gem 'puma', '>= 6.0'

gem 'redis', '>= 5.0'

# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1'

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin AJAX possible
gem 'rack-cors', require: 'rack/cors'

# for faster JSON parsing/encoding
gem 'oj'

# A generic swappable back-end for JSON handling
gem 'multi_json'

# DSL for writing APIs
gem 'grape'
gem 'grape-swagger'
gem 'grape-entity'

# Authorization
gem 'pundit'

# For background jobs
gem 'sidekiq', '>= 7.0'

# Asset pipeline
gem 'sprockets-rails'
gem 'sassc-rails'
gem 'semantic-ui-sass'

# Webpacker successor (maintained fork) for frontend bundling
gem 'shakapacker'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', require: false

# for http requests
gem 'http'

group :development, :test do
  gem 'debug'
  gem 'pry'
  gem 'pry-rails'

  gem 'dotenv-rails'
  gem 'simplecov'

  gem 'rspec-rails'

  gem 'factory_bot_rails'

  gem 'database_cleaner-active_record'

  gem 'sqlite3'
end

group :development do
  gem 'rubocop'

  gem 'listen'

  # Annotate Rails classes with schema and routes info
  gem 'annotate'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
