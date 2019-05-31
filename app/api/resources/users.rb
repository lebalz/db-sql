module Resources
  class Users < Grape::API
    resource :user do
      desc 'Get current user'
      get do
        present current_user, with: Entities::User
      end
    end
  end
end
