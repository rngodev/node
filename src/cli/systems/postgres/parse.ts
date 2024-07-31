import TsResult, { Result } from 'ts-results'
import { z } from 'zod'

import { Schema, SchemaType, Stream } from '@cli/config'
import { InferArgs, InferError, getSystemParameter } from '@cli/systems'

import { ColumnInfo, TableInfo } from './query'
import { PostgresDataType } from './types'

const { Err, Ok } = TsResult

export type PostgresParmeter = {
  host?: string
  port?: number
  user?: string
  password?: string
  database: string
  schema: string
}

export function buildParameters(
  args: InferArgs
): Result<PostgresParmeter, InferError[]> {
  function getParam(parameterName: string) {
    return getSystemParameter(
      args.env,
      args.namespaceName,
      args.systemName,
      parameterName,
      (args.system.parameters || {})[parameterName]
    )
  }

  let errors: InferError[] = []

  const database = getParam('database')
  if (!database) {
    errors.push({ message: 'Could not resolve parameter database' })
  }

  const port = getParam('port')
  const portResult = z.coerce.number().int().safeParse(port)
  let parsedPort: number | undefined
  if (portResult.success) {
    parsedPort = portResult.data
  } else {
    errors.push({ message: 'Parameter port is not an integer' })
  }

  if (errors.length > 0) {
    return Err(errors)
  } else {
    return Ok({
      host: getParam('host'),
      port: parsedPort!,
      user: getParam('user'),
      password: getParam('password'),
      database: database!,
      schema: getParam('schema') || 'public',
    })
  }
}

export function tableInfoToStreams(
  tableInfo: TableInfo[],
  systemName: string
): Record<string, Stream> {
  return tableInfo.reduce((streams: Record<string, Stream>, tableInfo) => {
    const schema: Schema = tableInfo.columns.reduce(
      (result, column) => {
        if (result.properties) {
          result.properties[column.column_name] = columnToJsonSchema(
            tableInfo.table,
            column
          )
        }

        if (column.is_nullable === 'NO') {
          const existing = result.required || []
          result.required = [...existing, column.column_name]
        }

        return result
      },
      { type: 'object', properties: {} } as Schema
    )

    const stream: Stream = {
      systems: { [systemName]: {} },
      schema,
    }

    streams[tableInfo.table] = stream

    return streams
  }, {})
}

function columnToJsonSchema(table: string, column: ColumnInfo): Schema {
  let ref = null

  if (column.referenced_column && column.referenced_table) {
    ref = { table: column.referenced_table, column: column.referenced_column }
  }

  let udtBasedType: SchemaType = 'string'

  if (column.udt_type === PostgresDataType.INTEGER) {
    udtBasedType = 'integer'
  }

  switch (column.data_type) {
    case PostgresDataType.ARRAY:
      return {
        type: 'array',
        items: {
          type: udtBasedType,
          enum: column.enum_values,
        },
      }

    case PostgresDataType.BIGINT:
      if (column.is_bigserial) {
        return {
          type: 'integer',
          rngo: {
            value: `(streams.${table}.last.id ?? 0) + 1`,
          },
        }
      } else {
        return {
          type: 'integer',
          ...(ref === null
            ? {
                minimum: BigInt(-9223372036854775808n),
                maximum: BigInt(9223372036854775807n),
              }
            : {
                rngo: {
                  value: `streams.${ref.table}.random.${ref.column}`,
                },
              }),
        }
      }

    case PostgresDataType.BOOLEAN:
      return {
        type: 'boolean',
      }

    case PostgresDataType.INTEGER:
      return {
        type: 'integer',
        ...(ref === null
          ? { minimum: BigInt(-2147483648), maximum: BigInt(2147483647) }
          : {
              rngo: {
                value: `streams.${ref.table}.random.${ref.column}`,
              },
            }),
      }

    case PostgresDataType.SMALLINT:
      return {
        type: 'integer',
        ...(ref === null
          ? { minimum: BigInt(-32768), maximum: BigInt(32767) }
          : {
              rngo: {
                value: `streams.${ref.table}.random.${ref.column}`,
              },
            }),
      }

    case PostgresDataType.TEXT:
      return {
        type: 'string',
      }

    case PostgresDataType.TIMESTAMP:
    case PostgresDataType.TIMESTAMPTZ:
      return {
        type: 'string',
        format: 'date-time',
      }

    case PostgresDataType.USER_DEFINED:
      return {
        type: udtBasedType,
        enum: column.enum_values,
      }

    default:
      return {
        type: 'string',
      }
  }
}
