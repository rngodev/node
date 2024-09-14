import { Command } from '@oclif/core'
import chalk from 'chalk'
import { promises as fs } from 'fs'
import ora from 'ora'
import path from 'path'

import * as rngoUtil from '@util'
import { Rngo } from '@main'
import { printCaughtError } from '@src/cli/util'

export default class Init extends Command {
  static description = 'Initialize this repo for rngo'

  async catch(error: unknown) {
    printCaughtError(this, error)
  }

  async run() {
    const configFilePath = Rngo.defaultConfigFilePath()
    const relativePath = path.relative(process.cwd(), configFilePath)
    const changedFiles: string[] = []

    const fileSpinner = ora(`Initializing config at ${relativePath}`).start()

    if (await rngoUtil.fileExists(configFilePath)) {
      fileSpinner.succeed(chalk.yellow(`${relativePath} already exists`))
    } else {
      changedFiles.push(configFilePath)
      fileSpinner.succeed()
      await rngoUtil.writeFile(configFilePath, InitialConfig)
    }

    const git = await rngoUtil.maybeGit()

    if (git) {
      const gitIgnoreSpinner = ora('Updating .gitignore').start()
      const gitIgnorePath = path.join(process.cwd(), '.gitignore')

      if (await rngoUtil.fileExists(gitIgnorePath)) {
        const gitIgnoreContents = await rngoUtil.readFile(gitIgnorePath)
        const referencesRngo = gitIgnoreContents?.includes(GitIngoreLines)

        if (referencesRngo) {
          gitIgnoreSpinner.succeed(
            chalk.yellow('.gitignore already setup for rngo')
          )
        } else {
          await fs.appendFile(gitIgnorePath, GitIngoreLines)
          changedFiles.push(gitIgnorePath)
          gitIgnoreSpinner.succeed()
        }
      } else {
        rngoUtil.writeFile(gitIgnorePath, GitIngoreLines)
        changedFiles.push(gitIgnorePath)
        gitIgnoreSpinner.succeed()
      }

      if (changedFiles.length > 0) {
        const gitAddSpinner = ora('Adding files to git').start()
        await git.add(changedFiles)
        gitAddSpinner.succeed()
      }
    }

    this.log()
    this.log(chalk.dim.green.bold('Your project is initialized for rngo!'))

    if (git && changedFiles.length > 0) {
      this.log(chalk.dim('Just review the changes and commit'))
    }
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

const GitIngoreLines = `.rngo/*
!.rngo/config.yml
`
