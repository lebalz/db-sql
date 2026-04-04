Rails.application.routes.draw do
  mount API => '/api'

  root to: proc {
             [200, { 'Content-Type' => 'application/json' },
              [{ status: 'ok' }.to_json]]
           }
end
