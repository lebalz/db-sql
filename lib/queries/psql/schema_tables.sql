SELECT
  table_schema || '.' || table_name as show_tables
FROM
  information_schema.tables
WHERE
  table_type = 'BASE TABLE'
AND
  table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY
  show_tables;