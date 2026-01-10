source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.0.2'
gem 'sassc-rails'
# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 6.1.3'
gem 'pg', '~> 1.1'
gem 'mysql2', '~>0.5.3'

# Use Puma as the app server
gem 'puma', '~> 5.6.4'

gem 'redis'
gem 'hiredis'
gem 'turbolinks', '~> 5'
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.16'

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin AJAX possibls
gem 'rack-cors', require: 'rack/cors'

# for faster JSON parsing/encoding
gem 'oj'

# A generic swappable back-end for JSON handling that choose the fastest available JSON coder
gem 'multi_json', '~>1.14.1'

# DSL for writing APIs
gem 'grape'
gem 'grape-swagger'
gem 'grape-entity'

# Authorization
gem 'pundit'

# For background jobs
gem 'sidekiq'

gem 'semantic-ui-sass'
gem 'webpacker', '~>5.2.1'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '>= 1.7.3', require: false

# Character encoding detection
# gem 'charlock_holmes'

# run tests from github
gem 'travis'

# for http requests
gem "http"

group :development, :test do
  gem 'pry', '0.14.1'
  gem 'pry-doc', '1.2.0'
  # 14.12.2021: not compatible with pry 0.14.1
  # gem 'pry-byebug', '3.9.0'
  gem 'pry-rails', '0.3.9'

  gem 'dotenv-rails'
  gem 'simplecov'
  gem 'codecov'

  gem 'rspec-rails'

  gem 'solargraph'

  # for vscode-development
  gem 'ruby-debug-ide', '~>0.7.2'
  gem 'debase', '~>0.2.5.beta2'

  gem 'factory_bot_rails'

  gem 'database_cleaner'

  # Dokku currently does not suppoert sqlite3
  gem 'sqlite3', '~> 1.4.2'
end

group :development do
  gem 'rubocop'

  gem 'listen'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.1'

  # Annotate Rails classes with schema and routes info
  gem 'annotate'
  # for performance measuring
  #   time = Benchmark.measure {
  #     code to test
  #   }
  #   puts time.real #or save it to logs
  gem 'benchmark'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
