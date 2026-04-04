-- get the definition for the referential_constraints view from:
-- \d+ information_schema.referential_constraints
-- and remove the last line (the one with the read permissions)
WITH referential_constraints AS (
   SELECT current_database()::information_schema.sql_identifier AS constraint_catalog,
    ncon.nspname::information_schema.sql_identifier AS constraint_schema,
    con.conname::information_schema.sql_identifier AS constraint_name,
        CASE
            WHEN npkc.nspname IS NULL THEN NULL::name
            ELSE current_database()
        END::information_schema.sql_identifier AS unique_constraint_catalog,
    npkc.nspname::information_schema.sql_identifier AS unique_constraint_schema,
    pkc.conname::information_schema.sql_identifier AS unique_constraint_name,
        CASE con.confmatchtype
            WHEN 'f'::"char" THEN 'FULL'::text
            WHEN 'p'::"char" THEN 'PARTIAL'::text
            WHEN 's'::"char" THEN 'NONE'::text
            ELSE NULL::text
        END::information_schema.character_data AS match_option,
        CASE con.confupdtype
            WHEN 'c'::"char" THEN 'CASCADE'::text
            WHEN 'n'::"char" THEN 'SET NULL'::text
            WHEN 'd'::"char" THEN 'SET DEFAULT'::text
            WHEN 'r'::"char" THEN 'RESTRICT'::text
            WHEN 'a'::"char" THEN 'NO ACTION'::text
            ELSE NULL::text
        END::information_schema.character_data AS update_rule,
        CASE con.confdeltype
            WHEN 'c'::"char" THEN 'CASCADE'::text
            WHEN 'n'::"char" THEN 'SET NULL'::text
            WHEN 'd'::"char" THEN 'SET DEFAULT'::text
            WHEN 'r'::"char" THEN 'RESTRICT'::text
            WHEN 'a'::"char" THEN 'NO ACTION'::text
            ELSE NULL::text
        END::information_schema.character_data AS delete_rule
   FROM pg_namespace ncon
     JOIN pg_constraint con ON ncon.oid = con.connamespace
     JOIN pg_class c ON con.conrelid = c.oid AND con.contype = 'f'::"char"
     LEFT JOIN pg_depend d1 ON d1.objid = con.oid AND d1.classid = 'pg_constraint'::regclass::oid AND d1.refclassid = 'pg_class'::regclass::oid AND d1.refobjsubid = 0
     LEFT JOIN pg_depend d2 ON d2.refclassid = 'pg_constraint'::regclass::oid AND d2.classid = 'pg_class'::regclass::oid AND d2.objid = d1.refobjid AND d2.objsubid = 0 AND d2.deptype = 'i'::"char"
     LEFT JOIN pg_constraint pkc ON pkc.oid = d2.refobjid AND (pkc.contype = ANY (ARRAY['p'::"char", 'u'::"char"])) AND pkc.conrelid = con.confrelid
     LEFT JOIN pg_namespace npkc ON pkc.connamespace = npkc.oid
)
SELECT
  cols.ordinal_position as "position",
  cols.table_schema AS "schema",
  cols.table_name AS "table",
  cols.column_name AS "column",
  cols.data_type AS "sql_type",
  cols.udt_name AS "type",
  cols.character_maximum_length  AS "limit",
  cols.numeric_precision AS "precision",
  cols.numeric_scale AS "scale",
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
      pk_def.table_catalog AS "referenced_database",
      pk_def.table_schema AS "referenced_schema",
      pk_def.table_name AS "referenced_table",
      pk_def.column_name AS "referenced_column",
      fk_def.table_catalog AS "from_database",
      fk_def.table_schema AS "from_schema",
      fk_def.table_name AS "from_table",
      fk_def.column_name AS "from_column",
      ref.constraint_name AS "constraint",
      'YES' AS "is_foreign",
      NULL AS "is_primary"
    FROM referential_constraints ref
      INNER JOIN information_schema.key_column_usage pk_def
        ON ref.unique_constraint_schema = pk_def.constraint_schema
          AND ref.unique_constraint_name = pk_def.constraint_name
      INNER JOIN information_schema.key_column_usage fk_def
        ON ref.constraint_schema = fk_def.constraint_schema
          AND ref.constraint_name = fk_def.constraint_name
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