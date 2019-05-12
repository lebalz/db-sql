source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '2.6.2'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 6.0.0.rc1'
gem 'pg', '~> 0.18'
# Use sqlite3 as the database for Active Record
gem 'sqlite3', '~> 1.3.6'
# Use Puma as the app server
gem 'puma', '~> 3.11'

gem 'redis'
gem 'hiredis'
gem 'turbolinks', '~> 5'
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin AJAX possibls
gem 'rack-cors', require: 'rack/cors'

# for faster JSON parsing/encoding
gem 'oj'

# A generic swappable back-end for JSON handling that choose the fastest available JSON coder
gem 'multi_json', '~>1.13.1'

# DSL for writing APIs
gem 'grape'
gem 'grape-swagger'
gem 'grape-entity'

# For background jobs
gem 'sidekiq'

gem 'semantic-ui-sass'
gem 'uglifier', '>=4.1.12'
gem 'webpacker', '~>4.0.2'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '>= 1.1.0', require: false

# Character encoding detection
# gem 'charlock_holmes'

# run tests from github
gem 'travis'

group :development, :test do
  gem 'pry'
  gem 'pry-doc'
  gem 'pry-byebug'
  gem 'pry-rails'

  gem 'dotenv-rails'
  gem 'simplecov'

  gem 'rspec-rails'

  gem 'factory_bot_rails'

  gem 'database_cleaner'
end

group :development do
  gem 'pronto'
  gem 'pronto-rubocop'
  
  gem 'listen', '>= 3.0.5', '< 3.2'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'

  gem 'annotate'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
