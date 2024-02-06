import { Rngo } from '.'

// TODO: build one that will never be expired
const jwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTcxNjI0OTAyMn0.zUx8DHI4xzKPG9mbXMjKGJ0NGC9ZGebsLBggNVK1bs0'

test('Rngo.init defaults', async () => {
  const initResult = await Rngo.init({ apiToken: jwt })
  expect(initResult.ok).toBe(true)

  const rngo = initResult.unwrap()
  expect(rngo.apiUrl.toString()).toBe('https://api.rngo.dev/')
})
