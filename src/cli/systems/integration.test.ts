import { inferConfigFromSystem } from '@cli/systems'

describe('inferConfigFromSystem', () => {
  test('postgres connection error', async () => {
    const result = await inferConfigFromSystem(
      'pg16',
      {
        type: 'postgres',
        parameters: {
          host: {
            value: 'localhost',
          },
          port: {
            value: '5555',
          },
          database: {
            value: 'wrong',
          },
          user: {
            value: 'wrong',
          },
          password: {
            value: 'wrong',
          },
        },
      },
      {}
    )

    expect(result.err).toEqual(true)

    if (result.err) {
      expect(result.val[0].message).toEqual(
        `Could not connect to system 'pg16'`
      )
    }
  })

  test('postgres success', async () => {
    const result = await inferConfigFromSystem(
      'pg16',
      {
        type: 'postgres',
        parameters: {
          host: {
            value: 'localhost',
          },
          port: {
            value: '54316',
          },
          database: {
            value: 'db16',
          },
          user: {
            value: 'user16',
          },
          password: {
            value: 'pw16',
          },
        },
      },
      {}
    )

    expect(result.ok).toEqual(true)

    if (result.ok) {
      const streams = result.val.streams || {}

      const aSchema = streams.a.schema
      console.log(aSchema)
      expect(aSchema.type).toEqual('object')
      expect(aSchema.required).toContain('serial')

      const aSerialProperty = aSchema.properties?.serial
      expect(aSerialProperty?.type).toBe('integer')
      expect(aSerialProperty?.rngo?.value).toBe('(streams.a.last.id ?? 0) + 1')
    }
  })
})
