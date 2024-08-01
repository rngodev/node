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
      expect(aSchema.type).toEqual('object')
      expect(aSchema.required).toContain('serial')

      const aSerialProp = aSchema.properties?.serial
      expect(aSerialProp?.type).toBe('integer')
      expect(aSerialProp?.rngo?.value).toBe('(streams.a.last.id ?? 0) + 1')

      const aBoolProp = aSchema.properties?.bool
      expect(aBoolProp?.type).toBe('boolean')

      const aTsProp = aSchema.properties?.ts
      expect(aTsProp?.type).toBe('string')
      expect(aTsProp?.format).toBe('date-time')

      const aTstzProp = aSchema.properties?.tstz
      expect(aTstzProp?.type).toBe('string')
      expect(aTstzProp?.format).toBe('date-time')
    }
  })
})
