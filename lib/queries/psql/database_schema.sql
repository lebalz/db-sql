SELECT
  cols.table_schema AS "schema",
  cols.table_name AS "table",
  cols.column_name AS "column",
  cols.data_type AS "data_type",
  cols.udt_name AS "type",
  cols.column_default AS "default",
  cols.is_nullable AS "is_nullable",
  COALESCE(constraints.is_primary, 'NO') AS "is_primary",
  COALESCE(constraints.is_foreign, 'NO') AS "is_foreign",
  constraints.constraint AS "constraint",
  constraints.referenced_database AS "referenced_database",
  constraints.referenced_schema AS "referenced_schema",
  constraints.referenced_table  AS "referenced_table",
  constraints.referenced_column AS "referenced_column"
FROM INFORMATION_SCHEMA.COLUMNS cols
  LEFT JOIN (
    SELECT
      cols.table_catalog AS "referenced_database",
      cols.table_schema AS "referenced_schema",
      cols.table_name AS "referenced_table",
      cols.column_name AS "referenced_column",
      refs.table_catalog AS "from_database",
      refs.table_schema AS "from_schema",
      refs.table_name AS "from_table",
      refs.column_name AS "from_column",
      refs.CONSTRAINT_NAME AS "constraint",
      'YES' AS "is_foreign",
      NULL AS "is_primary"
    FROM information_schema.key_column_usage refs
      /* join the information about the referenced column */
      INNER JOIN information_schema.columns cols
        ON  refs.constraint_catalog=cols.table_catalog
          AND refs.constraint_schema=cols.table_schema
          AND refs.table_name=cols.table_name
          AND refs.position_in_unique_constraint=cols.ordinal_position
    UNION
    SELECT
      NULL AS "referenced_database",
      NULL AS "referenced_schema",
      NULL AS "referenced_table",
      NULL AS "referenced_column",
      refs.table_catalog AS "from_database",
      refs.table_schema AS "from_schema",
      refs.table_name AS "from_table",
      refs.column_name AS "from_column",
      refs.constraint_name AS "constraint",
      NULL AS "is_foreign",
      'YES' AS "is_primary"
    FROM information_schema.key_column_usage refs
    WHERE refs.position_in_unique_constraint IS NULL
  ) constraints
  ON cols.table_catalog=constraints.from_database
    AND cols.table_schema=constraints.from_schema
    AND cols.table_name=constraints.from_table
    AND cols.column_name=constraints.from_column
WHERE
    cols.table_schema != 'pg_catalog'
    AND cols.table_schema != 'information_schema'
ORDER BY cols.table_catalog, cols.table_schema, cols.table_name, cols.column_name;