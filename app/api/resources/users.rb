module Resources
  class Users < Grape::API
    resource :users do
      desc 'Get all Users'
      get do
        present User.all, with: Entities::User
      end
    end
  end
end
