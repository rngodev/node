import { Command } from '@oclif/core'
import inquirer from 'inquirer'

import { printCaughtError, setTokenInGlobalConfig } from '@cli/util'

export default class Logout extends Command {
  static summary = 'End the API session.'

  async catch(error: unknown) {
    printCaughtError(this, error)
  }

  async run(): Promise<void> {
    const choice = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'logout',
        message: `Are you sure you want to logout?`,
        default: true,
      },
    ])

    if (choice.logout) {
      await setTokenInGlobalConfig(undefined)
    }
  }
}
