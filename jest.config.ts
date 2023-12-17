import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  verbose: true,
  transform: {},
  testMatch: ['**/?(*.)+(test).js'],
}

export default config
