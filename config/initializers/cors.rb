# frozen_string_literal: true

# Avoid CORS issues when API is called from the frontend app.
# Handle Corss-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests,

# see https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end