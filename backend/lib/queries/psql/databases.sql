SELECT datname AS "databases"
FROM pg_database
WHERE
  datistemplate = false
  AND
  has_database_privilege(datname, 'CONNECT');
