# @param db_type [Symbol, String] one of DbServer.db_types
# @return [String, nil] currently only :mysql and :psql are supported.
def query_path(db_type:)
  case db_type.to_sym
  when :mysql
    File.join('lib','queries','mysql')
  when :psql
    File.join('lib','queries','psql')
  end
end

# @param name [String] name of the query action. When no file
#   with the provided name exists under lib/queries/:db_type/:name.sql
#   an empty string is returned.
#   e.g. 'databases'.
# @param db_type [Symbol, String] one of DbServer.db_types
# @return [String] currently only :mysql and :psql are supported.
def query_for(name:, db_type:)
  file = File.join(
    query_path(db_type: db_type),
    "#{name}.sql"
  )
  return '' unless File.exist?(file)
  File.read(file)
end