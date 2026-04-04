# frozen_string_literal: true

module ErrorHandling
  def self.included(base)
    # Generate a consistent API 404 for all unmatched API routes.
    base.route :any, '*path' do
      status_code = 404
      error!(
        {
          error: {
            code: 'route_not_found',
            message: 'The requested API route does not exist',
            path: request.path
          },
          status: status_code,
          timestamp: Time.current.iso8601
        },
        status_code
      )
    end

    base.rescue_from ActiveRecord::RecordNotFound do |error|
      Rack::Response.new(
        {
          'status' => 404,
          'message' => error.message
        }.to_json, 404
      )
    end

    base.rescue_from ActiveRecord::RecordInvalid do |e|
      error_response(message: e.message, status: 422)
    end

    base.rescue_from Pundit::NotAuthorizedError do |e|
      error_response(message: e.message, status: 403)
    end
  end
end
