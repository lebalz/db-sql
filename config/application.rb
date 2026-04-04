require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

# Rails 8.1 no longer exposes preview_path=, but legacy config paths may still set it.
require 'action_mailer/base'
class << ActionMailer::Base
  unless respond_to?(:preview_path=)
    def preview_path=(path)
      self.preview_paths = Array(path)
    end
  end

  unless respond_to?(:preview_path)
    def preview_path
      Array(preview_paths).first
    end
  end
end

module DbSql
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1
    config.autoload_paths << Rails.root.join('app/api')
    config.eager_load_paths << Rails.root.join('app/api')

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.
  end
end
