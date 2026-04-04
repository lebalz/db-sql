SELECT
  cols.ORDINAL_POSITION as 'position',
  cols.TABLE_SCHEMA AS 'schema',
  cols.TABLE_NAME as 'table',
  cols.COLUMN_NAME as 'column',
  cols.COLUMN_TYPE AS 'sql_type',
  cols.DATA_TYPE AS 'type',
  cols.CHARACTER_MAXIMUM_LENGTH AS 'limit',
  cols.NUMERIC_PRECISION AS 'precision',
  cols.NUMERIC_SCALE AS 'scale',
  NULLIF(COALESCE(cols.COLUMN_DEFAULT, cols.extra), '') AS 'default',
  cols.IS_NULLABLE AS 'is_nullable',
  (
    CASE WHEN COLUMN_KEY='PRI'
    THEN 'YES'
    ELSE 'NO'
    END
  ) AS 'is_primary',
  (
    CASE WHEN COLUMN_KEY='MUL'
    THEN 'YES'
    ELSE 'NO'
    END
  ) AS 'is_foreign',
  constraints.CONSTRAINT_NAME AS 'constraint',
  constraints.REFERENCED_TABLE_SCHEMA AS 'referenced_database',
  constraints.REFERENCED_TABLE_SCHEMA AS 'referenced_schema',
  constraints.REFERENCED_TABLE_NAME  AS 'referenced_table',
  constraints.REFERENCED_COLUMN_NAME AS 'referenced_column'
FROM INFORMATION_SCHEMA.COLUMNS cols
  LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE constraints
    ON cols.TABLE_SCHEMA = constraints.TABLE_SCHEMA
      AND cols.TABLE_NAME = constraints.TABLE_NAME
      AND cols.COLUMN_NAME = constraints.COLUMN_NAME
WHERE
  cols.TABLE_SCHEMA=DATABASE()
ORDER BY cols.TABLE_SCHEMA, cols.TABLE_NAME, cols.COLUMN_NAME;