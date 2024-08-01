import pg from 'pg'

import { PostgresParmeter } from './parse'
import {
  PostgresDataType,
  normalizeUdtName,
  parsePostgresDataType,
  parseUdtName,
} from './types'

export interface TableInfo {
  table: string
  columns: ColumnInfo[]
  row_count: number
}

export interface ColumnInfo {
  column_name: string
  data_type: PostgresDataType
  is_nullable: string
  is_primary_key: boolean
  is_bigserial: boolean
  udt_type?: PostgresDataType
  enum_values?: string[]
  character_maximum_length?: number
  referenced_table?: string // Foreign key information
  referenced_column?: string // Foreign key information
}

export async function pgHelper(
  parameters: PostgresParmeter
): Promise<TableInfo[]> {
  const client = new pg.Client({
    host: parameters.host,
    port: parameters.port,
    user: parameters.user,
    password: parameters.password,
    database: parameters.database,
  })

  await client.connect()

  const tableResult = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${parameters.schema}'`
  )

  const enumResults = await client.query(`
    SELECT
      t.typname AS enum_name,
      e.enumlabel AS enum_value
    FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = '${parameters.schema}';
  `)

  const tablesWithColumns = await Promise.all(
    tableResult.rows.map(async (table) => {
      const columnsRes = await client.query(`
      WITH fk_info AS (
          SELECT
            con.conname AS constraint_name,
            con.conrelid::regclass AS from_table,
            att1.attname AS from_column,
            con.confrelid::regclass AS referenced_table,
            att2.attname AS referenced_column
          FROM
            pg_constraint con
          JOIN
            pg_attribute att1
          ON
            att1.attrelid = con.conrelid
          AND
            att1.attnum = con.conkey[1]
          JOIN
            pg_attribute att2
          ON
            att2.attrelid = con.confrelid
          AND
            att2.attnum = con.confkey[1]
          WHERE
            con.contype = 'f'
        ),
        column_defaults AS (
          SELECT
            att.attname,
            att.attrelid::regclass AS table_name,
            pg_get_expr(adef.adbin, adef.adrelid) AS default_value
          FROM
            pg_attribute att
          JOIN
            pg_attrdef adef
          ON
            att.attrelid = adef.adrelid
          AND
            att.attnum = adef.adnum
          WHERE
            att.atthasdef
        )
        SELECT
          c.column_name,
          c.data_type,
          c.udt_name,
          c.is_nullable,
          c.character_maximum_length,
          (
            SELECT count(*) > 0
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_name = kcu.table_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND kcu.table_name = '${table.table_name}'
            AND kcu.column_name = c.column_name
          ) as is_primary_key,
          (
            SELECT
              CASE WHEN c.is_nullable = 'YES' THEN
                (count(*) filter (where c.column_name IS NULL)::decimal / NULLIF(count(*), 0)) * 100
              ELSE
                NULL
              END
            FROM "${parameters.schema}"."${table.table_name}"
          ) as null_rate,
          fk_info.referenced_table, -- Include the referenced_table in the query result
          fk_info.referenced_column, -- Include the referenced_column in the query result
          (
            SELECT EXISTS (
              SELECT 1
              FROM column_defaults cd
              WHERE cd.table_name = '"${table.table_name}"'::regclass
              AND cd.attname = c.column_name
              AND cd.default_value LIKE 'nextval%')
          ) AS is_bigserial
        FROM information_schema.columns c
        LEFT JOIN fk_info
        ON fk_info.from_table = '"${table.table_name}"'::regclass
        AND fk_info.from_column = c.column_name
        WHERE table_name = '${table.table_name}'
        GROUP BY c.column_name, c.data_type, c.udt_name, c.is_nullable, fk_info.referenced_table, fk_info.referenced_column, c.ordinal_position, c.character_maximum_length
        ORDER BY c.ordinal_position
    `)

      const columns: ColumnInfo[] = columnsRes.rows.map((column) => {
        const enumValues = enumResults.rows
          .filter(
            (enumRow) => enumRow.enum_name === normalizeUdtName(column.udt_name)
          )
          .map((enumRow) => enumRow.enum_value)

        return {
          column_name: column.column_name,
          data_type:
            parsePostgresDataType(column.data_type) ?? PostgresDataType.UNKNOWN,
          udt_type: column.udt_name
            ? parseUdtName(column.udt_name) || PostgresDataType.UNKNOWN
            : undefined,
          is_nullable: column.is_nullable,
          is_primary_key: column.is_primary_key,
          is_bigserial: column.is_bigserial,
          enum_values: enumValues.length > 0 ? enumValues : undefined,
          character_maximum_length: column.character_maximum_length,
          // Include the referenced table and column information if it exists
          referenced_table: column.referenced_table,
          referenced_column: column.referenced_column,
        }
      })

      return {
        table: table.table_name,
        columns: columns,
      }
    })
  )

  const tablesWithColumnsAndRowCount = await Promise.all(
    tablesWithColumns.map(async (tableWithColumns) => {
      const rowCountRes = await client.query(
        `SELECT COUNT(*) FROM "${parameters.schema}"."${tableWithColumns.table}"`
      )

      return {
        ...tableWithColumns,
        row_count: rowCountRes.rows[0].count,
      }
    })
  )

  await client.end()
  return tablesWithColumnsAndRowCount
}
