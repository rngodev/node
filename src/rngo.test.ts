import { jest } from '@jest/globals'

import { Rngo } from '.'

// TODO: build one that will never be expired
const jwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gU21pdGgiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTcxNjI0OTAyMn0.zUx8DHI4xzKPG9mbXMjKGJ0NGC9ZGebsLBggNVK1bs0'

async function validRngo() {
  const initResult = await Rngo.init({ apiToken: jwt })
  return initResult.unwrap()
}

test('Rngo.init defaults', async () => {
  const initResult = await Rngo.init({ apiToken: jwt })
  expect(initResult.ok).toBe(true)

  const rngo = initResult.unwrap()
  expect(rngo.apiUrl.toString()).toBe('https://api.rngo.dev/')
})

describe('Rngo#upsertConfigFile', () => {
  test('success', async () => {
    const rngo = await validRngo()
    const currentTime = new Date()

    jest
      .spyOn(rngo.gqlClient, 'request')
      .mockResolvedValueOnce({
        upsertConfigFile: {
          __typename: 'ConfigFile',
          id: 'clse48vh2000a08l2h92rhyps',
          branch: {
            id: 'clse4l1vc000008kwer9p5t5d',
          },
        },
      })
      .mockResolvedValueOnce({
        configFile: {
          processingCompletedAt: currentTime.toISOString(),
        },
      })

    const result = await rngo.upsertConfigFile()
    expect(result.ok).toBe(true)

    const configFile = result.unwrap()
    expect(configFile.id).toBe('clse48vh2000a08l2h92rhyps')
    expect(configFile.branchId).toBe('clse4l1vc000008kwer9p5t5d')
  })
})
