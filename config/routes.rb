Rails.application.routes.draw do
  mount API => '/api'

  get '*path', to: 'pages#index'
  root 'pages#index'
end
