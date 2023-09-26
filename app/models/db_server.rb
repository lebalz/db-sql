# frozen_string_literal: true
require Rails.root.join('lib', 'queries', 'query')

class InvalidDatabaseTypeError < StandardError
end

# == Schema Information
#
# Table name: db_servers
#
#  id                       :uuid             not null, primary key
#  db_type                  :integer
#  default_sql_limit        :integer          default(10000)
#  error_query_count        :integer          default(0)
#  host                     :string
#  initial_db               :string
#  initial_table            :string
#  initialization_vector    :string
#  name                     :string
#  password_encrypted       :string
#  port                     :integer
#  query_count              :integer          default(0)
#  username                 :string
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  database_schema_query_id :uuid
#  group_id                 :uuid
#  user_id                  :uuid
#
# Indexes
#
#  index_db_servers_on_database_schema_query_id  (database_schema_query_id)
#  index_db_servers_on_group_id                  (group_id)
#  index_db_servers_on_user_id                   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (database_schema_query_id => database_schema_queries.id)
#  fk_rails_...  (group_id => groups.id)
#  fk_rails_...  (user_id => users.id)
#

class DbServer < ApplicationRecord
  DB_TYPES = %i[psql mysql mariadb].freeze
  enum db_type: DbServer::DB_TYPES
  DEFAULT_PORT_PSQL = 5432
  DEFAULT_PORT_MYSQL = 3306
  DEFAULT_PORT_MARIADB = 3306

  MYSQL_CONNECTION_OPTIONS = {
    encoding: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  }.freeze

  PSQL_CONNECTION_OPTIONS = {}.freeze

  DEFAULT_AR_DB_ADAPTER = {
    'psql' => 'postgresql',
    'mysql' => 'mysql2',
    'mariadb' => 'mysql2'
  }.freeze

  DEFAULT_DATABASE_NAME = {
    'psql' => 'postgres',
    'mysql' => 'information_schema',
    'mariadb' => 'information_schema'
  }.freeze

  belongs_to :user, touch: true, optional: true
  belongs_to :group, touch: true, optional: true
  belongs_to :database_schema_query

  has_many :sql_queries, dependent: :delete_all

  before_validation :set_database_schema_query, on: :create
  validate :belongs_to_either_user_or_group

  # @return [:user, :group]
  def owner_type
    return :user unless user_id.nil?
    return :group unless group_id.nil?

    throw 'no owner set'
  end

  # @return [User, Group]
  def owner
    case owner_type
    when :user
      user
    when :group
      group
    end
  end

  # @return [UUID]
  def owner_id
    owner.id
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [String] cleartext password for the db connection
  def password(key)
    decipher = OpenSSL::Cipher::AES256.new :CBC
    decipher.decrypt
    decipher.iv = Base64.strict_decode64(initialization_vector)
    decipher.key = Base64.strict_decode64(key)
    decipher.update(Base64.strict_decode64(password_encrypted)) + decipher.final
  end

  def recrypt!(old_crypto_key:, new_crypto_key:)
    db_password = password(old_crypto_key)
    reset_crypto_key(new_crypto_key: new_crypto_key, db_password: db_password)
  end

  def reset_crypto_key(new_crypto_key:, db_password: '-')
    new_crypt = DbServer.encrypt(
      key: new_crypto_key,
      db_password: db_password
    )
    update!(
      initialization_vector: new_crypt[:initialization_vector],
      password_encrypted: new_crypt[:encrypted_password]
    )
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param password [String] password for db server connection to encrypt
  # @return [Hash<symbol, string>] hash with encrypted password
  #   and initialization_vector:
  # @example encrypted password
  #   {
  #     encrypted_password: <Base64 encoded encrypted string>,
  #     initialization_vector: <Base64 enctoded string>
  #   }
  def self.encrypt(key:, db_password:)
    error!('No AES key sent', 401) unless key

    aes_key = Base64.strict_decode64(key)
    cipher = OpenSSL::Cipher::AES.new(256, :CBC)
    initialization_vector = cipher.random_iv
    cipher.iv = initialization_vector
    cipher.encrypt
    cipher.key = aes_key
    pw_encrypted = cipher.update(db_password) + cipher.final
    {
      encrypted_password: Base64.strict_encode64(pw_encrypted),
      initialization_vector: Base64.strict_encode64(initialization_vector)
    }
  end

  def localhost?
    ActionDispatch::Request::LOCALHOST =~ host || /localhost/i =~ host
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  def connect(key:, database_name:)
    database_name ||= default_database_name
    return yield @active_connection if @active_connection&.active?

    @connection ||= ActiveRecord::ConnectionAdapters::ConnectionHandler.new
    @conn_key ||= connection_key(database_name: database_name)

    # don't let a user connect to the servers localhost
    db_host = ENV['RAILS_ENV'] == 'production' && localhost? ? nil : host
    unless @connection.connected?(@conn_key)
      @connection.establish_connection({
        as: :hash,
        adapter: DEFAULT_AR_DB_ADAPTER[db_type],
        host: db_host,
        port: port,
        username: username,
        password: password(key),
        database: database_name,
        name: @conn_key,
        flags: ["MULTI_STATEMENTS"],
        sslmode: :prefer,
        **db_specific_connection_options
      }, owner_name: @conn_key)
    end
    @active_connection = @connection.retrieve_connection(@conn_key)
    yield(@active_connection)
  ensure
    close_connection unless @keep_connection
  end

  # use when performing subsequent db-calls to the same database.
  # @yield [DbServer] self
  def reuse_connection
    @keep_connection = true
    yield self
  ensure
    @keep_connection = false
    close_connection
  end

  def close_connection
    # ActiveRecord::ConnectionAdapters::ConnectionHandler#remove_connection
    # will close active connection and the defined connection
    @connection&.remove_connection_pool(@conn_key)
    @connection = @conn_key = @active_connection = nil
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [Hash]
  #   e.g.
  #     {
  #       success: true,
  #     }
  #   or
  #     {
  #       success: false,
  #       message: "Could not connect to server: Connection refused..."
  #     }
  def test_connection(key:)
    connect(key: key, database_name: default_database_name) do |conn|
      return {
        success: !!conn
      }
    end
  rescue StandardError => e
    {
      success: false,
      message: e.message
    }
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [ActiveRecord::Result]
  def exec_query(key:, database_name: nil)
    connect(key: key, database_name: database_name) do |connection|
      connection.exec_query(yield)
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [ActiveRecord::Result]
  def exec_raw_query(key:, database_name: nil)
    raise InvalidDatabaseTypeError, "Type '#{db_type}' can not perform raw queries" unless mysql? || mariadb? || psql?

    connect(key: key, database_name: database_name) do |connection|
      if mysql? || mariadb?
        connection.raw_connection.query_options[:as] = :hash

        results = []
        begin
          results << (connection.execute(yield) || [])
          results << (connection.raw_connection.store_result || []) while connection.raw_connection.next_result
        rescue StandardError => e
          return {
            error: e,
            state: :error
          }
        ensure
          connection.raw_connection.abandon_results!
        end
        {
          result: results,
          state: :success
        }
      elsif psql?
        results = [[]]
        error = nil
        begin
          connection.raw_connection.send_query(yield)
          connection.raw_connection.set_single_row_mode
          while (result = connection.raw_connection.get_result) &&
              results.last.length < default_sql_limit
            if result.ntuples.zero?
              results << []
            end
            if result.error_message.empty?
              results.last << result.first if result.first
            else
              error = result.error_message
            end
            result.clear until result.cleared?
          end
          if results.last.length.zero?
            results.pop
          end
        rescue StandardError => e
          return {
            error: e,
            state: :error
          }
        ensure
          connection.raw_connection.flush
        end
        unless error.nil?
          return {
            error: error,
            state: :error
          }
        end
        return {
          result: results,
          limit_reached: results.length >= default_sql_limit,
          state: :success
        }
      end
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @return [Array<String>] all database_name names for a connection
  def database_names(key:)
    exec_query(key: key, database_name: default_database_name) do
      query_for(db_type: db_type, name: :databases)
    end&.rows&.flatten&.sort || []
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @return [Hash] full table structure
  # @example
  # {
  #   name: 'swissski',
  #   db_server_id: 'fd878c8a-0953-4165-add8-c37283e98900',
  #   schemas: [
  #     {
  #       name: 'public',
  #       tables: [
  #         {
  #           name: 'athletes'
  #           columns: [
  #             {
  #               name: 'id',
  #               null: false,
  #               is_primary: true,
  #               is_foreign: false,
  #               default: 'auto_increment',
  #               sql_type_metadata: {
  #                 type: 'int',
  #                 limit: nil,
  #                 precision: 10,
  #                 scale: nil,
  #                 sql_type: 'int(4)'
  #               },
  #               constraints: [
  #                 {
  #                   name: '',
  #                   database: '',
  #                   schema: '',
  #                   table: '',
  #                   column: ''
  #                 }
  #               ]
  #             },
  #             ...
  #           ]
  #         },
  #         ...
  #       ]
  #     },
  #     ...
  #   ]
  # }
  def full_database(key:, database_name:)
    result = exec_query(key: key, database_name: database_name) do
      database_schema_query.to_s
    end

    columns = result.columns.map(&:downcase)

    schema_idx = columns.index('schema')
    table_idx = columns.index('table')
    column_idx = columns.index('column')
    sql_type_idx = columns.index('sql_type')
    position_idx = columns.index('position')
    limit_idx = columns.index('limit')
    precision_idx = columns.index('precision')
    scale_idx = columns.index('scale')
    type_idx = columns.index('type')
    default_idx = columns.index('default')
    is_nullable_idx = columns.index('is_nullable')
    is_primary_idx = columns.index('is_primary')
    is_foreign_idx = columns.index('is_foreign')
    constraint_idx = columns.index('constraint')
    ref_database_idx = columns.index('referenced_database')
    ref_schema_idx = columns.index('referenced_schema')
    ref_table_idx = columns.index('referenced_table')
    ref_column_idx = columns.index('referenced_column')

    rows = result.rows
    schemas = {}
    rows.each do |row|
      schemas[row[schema_idx]] ||= {}
      schemas[row[schema_idx]][row[table_idx]] ||= {}
      if schemas[row[schema_idx]][row[table_idx]][row[column_idx]].nil?
        schemas[row[schema_idx]][row[table_idx]][row[column_idx]] = {
          name: row[column_idx],
          position: row[position_idx],
          null: row[is_nullable_idx] == 'YES',
          is_primary: row[is_primary_idx] == 'YES',
          is_foreign: row[is_foreign_idx] == 'YES',
          default: row[default_idx],
          sql_type_metadata: {
            type: row[type_idx],
            limit: row[limit_idx],
            precision: row[precision_idx],
            scale: row[scale_idx],
            sql_type: row[sql_type_idx]
          }.compact,
          constraints: [
            row[constraint_idx].nil? ? nil : {
              name: row[constraint_idx],
              database: row[ref_database_idx],
              schema: row[ref_schema_idx],
              table: row[ref_table_idx],
              column: row[ref_column_idx]
            }.compact
          ].compact
        }.compact
      elsif !row[constraint_idx].nil?
        schemas[row[schema_idx]][row[table_idx]][row[column_idx]][:constraints] << {
          name: row[constraint_idx],
          database: row[ref_database_idx],
          schema: row[ref_schema_idx],
          table: row[ref_table_idx],
          column: row[ref_column_idx]
        }.compact
      end
    end

    # bring the schema in a grape api ready format
    db_schemas = schemas.reduce([]) do |s_memo, (schema, tables)|
      s_memo << {
        name: schema,
        tables: tables.reduce([]) do |t_memo, (table, cols)|
          t_memo << {
            name: table,
            columns: cols.values
          }
        end
      }
    end
    {
      name: database_name,
      db_server_id: id,
      schemas: db_schemas
    }
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @return [Array<String>] all table_name names in the database_name
  def table_names(key:, database_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.tables.sort
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<String>] columns of a table_name
  def column_names(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.columns(table_name)
    end.map(&:name)
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<Hash>] columns of a table_name
  # @example columns of a table
  #   [
  #     {
  #       name: 'id',
  #       collation: nil,
  #       default: nil,
  #       default_function: "nextval('ninja_turtles_id_seq'::regclass)",
  #       null: false,
  #       serial: true,
  #       sql_type_metadata: {
  #         limit: 4,
  #         precision: nil,
  #         scale: nil,
  #         sql_type: 'integer',
  #         type: :integer
  #       }
  #     }
  #   ]
  def columns(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.columns(table_name).map do |column|
        {
          name: column.name,
          collation: column.collation,
          default: column.default,
          default_function: column.default_function,
          null: column.null,
          serial: column.respond_to?(:serial?) ? column.serial? : false,
          sql_type_metadata: {
            limit: column.sql_type_metadata.limit,
            precision: column.sql_type_metadata.precision,
            scale: column.sql_type_metadata.scale,
            sql_type: column.sql_type_metadata.sql_type,
            type: column.sql_type_metadata.type
          }
        }
      end
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<String>] primary keys of a table_name
  def primary_key_names(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.primary_keys(table_name).sort
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<Hash>] foreign keys of the table_name
  # @example foreign keys of a table_name
  #   [
  #     {
  #       from_table: "tore",
  #       to_table: "spiele",
  #       options: {
  #         column: "spiel_id",
  #         name: "tore_ibfk_1",
  #         primary_key: "id",
  #         on_update: nil,
  #         on_delete: nil
  #       }
  #     },
  #     {
  #       from_table: "tore",
  #       to_table: "spieler",
  #       options: {
  #         column: "spieler_id",
  #         name: "tore_ibfk_2",
  #         primary_key: "id",
  #         on_update: nil,
  #         on_delete: nil
  #       }
  #     }
  #   ]
  def foreign_keys(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.foreign_keys(table_name).map(&:to_h)
    end
  end

  # @param key [String] base64 encoded crypto key from the user
  # @param database_name [String] name of the database_name
  # @param table_name [String] name of the table_name
  # @return [Array<Hash>] indexs of a table_name
  # @example indexes of a table_name
  #   [
  #     {
  #       table: "teams",
  #       name: "id",
  #       unique: true,
  #       columns: ["id"],
  #       lengths: {},
  #       orders: {},
  #       opclasses: {},
  #       where: nil,
  #       type: nil,
  #       using: :btree,
  #       comment: nil
  #     }
  #   ]
  def indexes(key:, database_name:, table_name:)
    connect(key: key, database_name: database_name) do |connection|
      connection.indexes(table_name).map do |index_def|
        index_def.instance_values.symbolize_keys
      end
    end
  end

  private

  def default_database_name
    initial_db || DEFAULT_DATABASE_NAME[db_type]
  end

  # @return [String] unique key for a db connection
  def connection_key(database_name:)
    database_name ||= default_database_name
    "#{id}-#{database_name}-#{DateTime.now.strftime('%Q')}"
  end

  # @return [Hash]
  #   additional connection options, e.g. utf8 capability for mysql
  def db_specific_connection_options
    if mysql?
      MYSQL_CONNECTION_OPTIONS
    else
      PSQL_CONNECTION_OPTIONS
    end
  end

  def set_database_schema_query
    return unless database_schema_query.nil?

    self.database_schema_query = DatabaseSchemaQuery.default(db_type)
  end

  def belongs_to_either_user_or_group
    return true if user_id || group_id

    errors.add :db_server, 'A db server must belong to either a user ot a group'
  end

end
