# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

def seed_users
  User.create(
    email: 'test@user.ch',
    password: 'asdfasdf',
    password_confirmation: 'asdfasdf'
  )
end

def seed_dbconnections
  user = User.find_by(email: 'test@user.ch')
  encrypted_password = DbConnection.encrypt(
    key: user.crypto_key('asdfasdf'),
    password: ENV.fetch("DB_SQL_DATABASE_PASSWORD")
  )
  DbConnection.create(
    name: 'dev',
    db_type: :psql,
    host: ENV.fetch("DB_SQL_DATABASE_HOST") { 'localhost' },
    port: 5432,
    initialization_vector: encrypted_password[:initialization_vector],
    username: ENV.fetch("DB_SQL_DATABASE_USER"),
    password_encrypted: encrypted_password[:encrypted_password], 
    user: user
  )
end

seed_users
seed_dbconnections
