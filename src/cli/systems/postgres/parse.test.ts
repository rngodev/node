import { tableInfoToStreams } from './parse'
import { TableInfo } from './query'
import { PostgresDataType } from './types'

describe('tableInfoToStreams', () => {
  it('should make a stream property for bigserials', () => {
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
              dyn: '(streams.users.last.id ?? 0) + 1',
            },
          },
        },
      },
    })
  })
})
