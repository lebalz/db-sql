Rails.application.routes.draw do
  mount API => '/api'

  root to: proc {
             [200, { 'Content-Type' => 'application/json' },
              [{ status: 'ok' }.to_json]]
           }

  match '*path', to: proc { |env|
    req = ActionDispatch::Request.new(env)
    body = {
      error: {
        code: 'route_not_found',
        message: 'The requested route does not exist',
        path: req.path
      },
      status: 404,
      timestamp: Time.current.iso8601
    }
    [404, { 'Content-Type' => 'application/json' }, [body.to_json]]
  }, via: :all
end
