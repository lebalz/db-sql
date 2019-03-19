module Resources
  class DbConnections < Grape::API
    
    helpers do

      def encrypt(password)
        key = request.headers['Encryption-Key']
        error!('No AES key sent', 401) unless key

        aes_key = Base64.strict_decode64(key)
        cipher = OpenSSL::Cipher::AES.new(256, :CBC)
        iv = cipher.random_iv
        cipher.encrypt
        cipher.key = aes_key
        pw_encrypted = cipher.update(password) + cipher.final
        {
          password: Base64.strict_encode64(pw_encrypted),
          iv: Base64.strict_encode64(iv),
          key: key
        }
      end
    end
    resource :db_connections do
      desc 'Get all Connections'
      get do
        present current_user.db_connections, with: Entities::DbConnection
      end

      desc 'Create DB Connection'
      params do
        requires :name, type: String, desc: ''
        requires :db_type, type: Symbol, default: :psql, values: %i[psql mysql mariadb sqlite], desc: ''
        requires :host, type: String, desc: ''
        requires :port, type: Integer, desc: ''
        requires :password, type: String, desc: ''
        optional :init_db, type: String, desc: ''
        optional :init_schema, type: String, desc: ''
      end
      post do
        encrypted_password = encrypt(params[:password])
        db_connection = DbConnection.create!(
          user: current_user,
          name: params[:name],
          db_type: DbConnection.db_types[params[:db_type]],
          host: params[:host],
          port: params[:port],
          password_encrypted: encrypted_password[:password],
          iv: encrypted_password[:iv],
          init_db: params[:init_db],
          init_schema: params[:init_schema]
        )
        present db_connection, with: Entities::DbConnection
      end
    end
  end
end
