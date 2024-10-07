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

describe('Rngo#publishConfigFile', () => {
  test('success', async () => {
    const rngo = await validRngo()

    jest
      .spyOn(rngo.gqlClient, 'request')
      .mockResolvedValueOnce({
        publishConfigFile: {
          id: 'clse48vh2000a08l2h92rhyps',
        },
      })
      .mockResolvedValueOnce({
        configFilePublication: {
          result: {
            __typename: 'ConfigFile',
            key: 'k1',
            branch: {
              name: 'feature1',
            },
          },
        },
      })

    const result = await rngo.publishConfigFile()
    expect(result.ok).toBe(true)

    const configFile = result.unwrap()
    expect(configFile.key).toBe('k1')
    expect(configFile.branch).toBe('feature1')
  })
})
