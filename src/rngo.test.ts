import { jest } from '@jest/globals'

import { Rngo } from '.'

const jwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjQ4NzEzMjgyODB9.zIfdnIeZjNN3WOJc2my-5Sm2BUOpaTKXJGxYcwQBydQ'

async function validRngo() {
  const initResult = await Rngo.init({ apiToken: jwt })
  return initResult.unwrap()
}

describe('Rngo.init', () => {
  test('defaults', async () => {
    const initResult = await Rngo.init({ apiToken: jwt })
    expect(initResult.ok).toBe(true)

    const rngo = initResult.unwrap()
    expect(rngo.apiUrl.toString()).toBe('https://api.rngo.dev/graphql')
  })
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
            name: 'feature1',
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
    expect(configFile.branch).toBe('feature1')
  })
})
