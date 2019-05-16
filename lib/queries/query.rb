def query_path(db_type:)
  case db_type.to_sym
  when :mysql
    File.join('lib','queries','mysql')
  when :psql
    File.join('lib','queries','psql')
  end
end

def query_for(name:, db_type:)
  File.read(
    File.join(
      query_path(db_type: db_type),
      "#{name}.sql"
    )
  )
end