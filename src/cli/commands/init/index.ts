import { Command } from '@oclif/core'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'

import * as rngoUtil from '@util'
import { Rngo } from '@main'

export default class Init extends Command {
  static description = 'Initialize this repo for rngo'

  async run() {
    const configFilePath = Rngo.defaultConfigFilePath()
    const relativePath = path.relative(process.cwd(), configFilePath)

    const fileSpinner = ora(`Initializing config at ${relativePath}`).start()

    if (await rngoUtil.fileExists(configFilePath)) {
      fileSpinner.warn(chalk.yellow(`Config file exists at ${relativePath}`))
    } else {
      fileSpinner.succeed()
      await rngoUtil.writeFile(configFilePath, InitialConfig)
    }

    this.log()
    this.log(chalk.dim.green.bold('Your project is initialized for rngo!'))
    this.log()
    this.log('Next, add these lines to your .gitignore:')
    this.log(chalk.dim(` .rngo/*`))
    this.log(chalk.dim(` !.rngo/config.yml`))
  }
}

const InitialConfig = `# A system enables seamless data import and stream inference.
#
# For more information, see: https://rngo.dev/docs/reference/systems.
systems:
# Defines a system named "db" for a Postgres database:
#   db:
#     type: postgres

# A stream defines a schema for a data source. They generally map to tables
# in relational DBs. Whenever possible, they should be inferred from a system.
#
# For more information, see: https://rngo.dev/docs/reference/streams
streams:
# Defines a stream named "users":
#  users:
#    systems:
#      db:
#        table: USERS
#    schema:
#      type: object
#      properties:
#        id:
#          type: integer
#        full_name:
#          type: string
`
