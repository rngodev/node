import { buildParameters, tableInfoToStreams } from './parse'
import { TableInfo } from './query'
import { PostgresDataType } from './types'

describe('buildParameters', () => {
  test('success', () => {
    const result = buildParameters({
      env: {},
      namespaceName: 'ns',
      systemName: 'sys',
      system: {
        parameters: {
          database: {
            default: 'my_db',
          },
          port: {
            value: '1234',
          },
        },
      },
    })

    const parameters = result.unwrap()
    expect(parameters.database).toEqual('my_db')
    expect(parameters.port).toEqual(1234)
  })
})

describe('tableInfoToStreams', () => {
  test('bigserial', () => {
    const tableInfo: TableInfo[] = [
      {
        table: 'users',
        columns: [
          {
            column_name: 'id',
            data_type: PostgresDataType.BIGINT,
            is_nullable: 'YES',
            is_primary_key: true,
            is_bigserial: true,
          },
        ],
        row_count: 50,
      },
    ]

    const streams = tableInfoToStreams(tableInfo, 'db')
    expect(streams).toStrictEqual({
      users: {
        systems: {
          db: {},
        },
        schema: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              rngo: {
                value: '(streams.users.last.id ?? 0) + 1',
              },
            },
          },
        },
      },
    })
  })

  test('required columns', () => {
    const tableInfo: TableInfo[] = [
      {
        table: 'users',
        columns: [
          {
            column_name: 'id',
            data_type: PostgresDataType.BIGINT,
            is_nullable: 'NO',
            is_primary_key: true,
            is_bigserial: true,
          },
          {
            column_name: 'name',
            data_type: PostgresDataType.TEXT,
            is_nullable: 'YES',
            is_primary_key: false,
            is_bigserial: false,
          },
        ],
        row_count: 50,
      },
    ]

    const streams = tableInfoToStreams(tableInfo, 'db')

    if (streams.users.schema.type === 'object') {
      expect(streams.users.schema.required).toEqual(['id'])
    } else {
      fail('schema is not an object')
    }
  })
})
