module ErrorHandling
  def self.included(base)
    unless Rails.env.development?
      # Generate a properly formatted 404 error for all unmatched routes except '/'
      base.route :any, '*path' do
        error!(
            {
                error: 'Not Found',
                detail: "No such route '#{request.path}'",
                status: '404'
            },
            404
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
    end
  end
end