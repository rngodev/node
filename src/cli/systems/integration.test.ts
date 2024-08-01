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
      expect(aSchema.required).toEqual(['id'])

      const aBintgProp = aSchema.properties?.bintg
      expect(aBintgProp?.type).toBe('integer')
      expect(aBintgProp?.minimum).toBe(BigInt(-9223372036854775808n))
      expect(aBintgProp?.maximum).toBe(BigInt(9223372036854775807n))

      const aIntgProp = aSchema.properties?.intg
      expect(aIntgProp?.type).toBe('integer')
      expect(aIntgProp?.minimum).toBe(BigInt(-2147483648))
      expect(aIntgProp?.maximum).toBe(BigInt(2147483647))

      const aSintgProp = aSchema.properties?.sintg
      expect(aSintgProp?.type).toBe('integer')
      expect(aSintgProp?.minimum).toBe(BigInt(-32768))
      expect(aSintgProp?.maximum).toBe(BigInt(32767))

      const aIdProp = aSchema.properties?.id
      expect(aIdProp?.type).toBe('integer')
      expect(aIdProp?.rngo?.value).toBe('(streams.a.last.id ?? 0) + 1')

      const aTxtProp = aSchema.properties?.txt
      expect(aTxtProp?.type).toBe('string')
      expect(aTxtProp?.maxLength).toBeUndefined()

      const aChrProp = aSchema.properties?.chr
      expect(aChrProp?.type).toBe('string')
      expect(aChrProp?.maxLength).toBe(512)

      const aVchrProp = aSchema.properties?.vchr
      expect(aVchrProp?.type).toBe('string')
      expect(aVchrProp?.maxLength).toBe(255)

      const aBoolProp = aSchema.properties?.bool
      expect(aBoolProp?.type).toBe('boolean')

      const aTsProp = aSchema.properties?.ts
      expect(aTsProp?.type).toBe('string')
      expect(aTsProp?.format).toBe('date-time')

      const aTstzProp = aSchema.properties?.tstz
      expect(aTstzProp?.type).toBe('string')
      expect(aTstzProp?.format).toBe('date-time')

      const aEnmProp = aSchema.properties?.enm
      expect(aEnmProp?.type).toBe('string')
      expect(aEnmProp?.enum).toStrictEqual(['a', 'b'])

      const bSchema = streams.b.schema
      expect(bSchema.type).toEqual('object')
      expect(bSchema.required).toEqual(['aid'])

      const bAidProp = bSchema.properties?.aid
      expect(bAidProp?.type).toBe('integer')
      expect(bAidProp?.rngo?.value).toBe('streams.a.random.id')

      const bBintgProp = bSchema.properties?.bintg
      expect(bBintgProp?.type).toBe('array')
      expect(bBintgProp?.items?.type).toBe('string')
      expect(bBintgProp?.items?.enum).toStrictEqual(['a', 'b'])
    }
  })
})
