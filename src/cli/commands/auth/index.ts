import { Command, ux } from '@oclif/core'
import chalk from 'chalk'
import clipboard from 'clipboardy'
import inquirer from 'inquirer'
import open from 'open'

import { Rngo } from '@main'

import { parseJwtToken } from '@src/util'

import {
  getGlobalConfig,
  printMessageAndExit,
  printErrorAndExit,
  setTokenInGlobalConfig,
  printCaughtError,
} from '@cli/util'

export default class Login extends Command {
  static summary = 'Authenticate with the rngo API.'

  async catch(error: unknown) {
    printCaughtError(this, error)
  }

  async run(): Promise<void> {
    const globalConfig = await getGlobalConfig()
    const parsedToken = parseJwtToken(globalConfig.token)

    if (parsedToken.ok) {
      printMessageAndExit(
        this,
        `Your rngo API session is still valid. To log out, run: ${chalk.yellow.bold(
          'rngo auth logout'
        )}`
      )
    }

    const deviceAuthResult = await Rngo.initiateDeviceAuth({
      deviceType: 'cli',
    })

    const deviceAuth = deviceAuthResult
      .mapErr((error) => {
        printErrorAndExit(this, [error])
      })
      .unwrap()

    this.log(chalk.bold('To authenticate the rngo CLI:'))
    this.log(` 1. Go to ${chalk.yellow.bold(deviceAuth.verificationUrl)}`)
    this.log(` 2. Maybe sign in or sign up`)
    this.log(
      ` 3. Paste ${chalk.yellow.bold(deviceAuth.userCode)} into the form and submit`
    )

    this.log()

    const choice = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'yes',
        message: `Copy the code and open the URL?`,
        default: true,
      },
    ])

    if (choice.yes) {
      await clipboard.write(deviceAuth.userCode)
      await open(deviceAuth.verificationUrl)
    }

    this.log()

    await ux.anykey('Press any key to complete authentication')
    const token = await deviceAuth.verify()

    if (token) {
      await setTokenInGlobalConfig(token)
    } else {
      printMessageAndExit(this, 'Login failed')
    }
  }
}
