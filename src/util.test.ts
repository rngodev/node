import { resolveApiUrl } from './util'

describe('resolveApiUrl', () => {
  test('ends with a /', () => {
    const url = resolveApiUrl('https://api.rngo.dev/')
    expect(url.unwrap().toString()).toBe('https://api.rngo.dev/graphql')
  })

  test("doesn't end with a /", () => {
    const url = resolveApiUrl('https://api.rngo.dev')
    expect(url.unwrap().toString()).toBe('https://api.rngo.dev/graphql')
  })

  test('ends with /graphql', () => {
    const url = resolveApiUrl('https://api.rngo.dev/graphql')
    expect(url.unwrap().toString()).toBe('https://api.rngo.dev/graphql')
  })

  test('no argument, RNGO_API_URL set', () => {
    process.env.RNGO_API_URL = 'https://api.rngo.dev'
    const url = resolveApiUrl(undefined)
    expect(url.unwrap().toString()).toBe('https://api.rngo.dev/graphql')
  })

  test('no argument, RNGO_API_URL not set', () => {
    delete process.env.RNGO_API_URL
    const url = resolveApiUrl(undefined)
    expect(url.unwrap().toString()).toBe('https://api.rngo.dev/graphql')
  })
})
