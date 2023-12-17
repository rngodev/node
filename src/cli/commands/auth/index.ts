import { Command } from '@oclif/core'
import chalk from 'chalk'
import clipboard from 'clipboardy'
import inquirer from 'inquirer'
import open from 'open'
import ora from 'ora'

import { DeviceAuth, parseToken } from '@main'

import {
  errorAndExit,
  getGlobalConfig,
  setTokenInGlobalConfig,
} from '@cli/util'

export default class Login extends Command {
  static summary = 'Authenticate with the rngo API.'

  async run(): Promise<void> {
    const globalConfig = await getGlobalConfig()
    const parsedToken = parseToken(globalConfig.token)

    if (parsedToken.ok) {
      this.log(
        `Your rngo API session is still valid. To log out, run: ${chalk.yellow.bold(
          'rngo auth logout'
        )}`
      )

      this.exit(1)
    }

    this.log(
      `To log into the rngo CLI, you'll need to log into rngo.dev and paste in a one-time auth code.\n`
    )

    const deviceAuthResult = await DeviceAuth.init()

    const deviceAuth = deviceAuthResult
      .mapErr((error) => {
        if (error.code === 'invalidOption') {
          errorAndExit(this, 'RngoInitFailed', error.message)
        }
      })
      .unwrap()

    const choice = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'yes',
        message: `Copy the auth code to your clipboard and open the login page in your browser?`,
        default: true,
      },
    ])

    if (choice.yes) {
      await clipboard.write(deviceAuth.userCode)
    }

    if (!choice.yes) {
      this.log(
        `\nCopy the auth code: ${chalk.yellow.bold(deviceAuth.userCode)}`
      )
      this.log(
        `Open the login page in your browser: ${chalk.yellow.bold(
          deviceAuth.verificationUrl
        )}`
      )
    }

    this.log()

    const spinner = ora(choice.yes ? 'Logging in' : 'Awaiting login').start()

    if (choice.yes) {
      await open(deviceAuth.verificationUrl)
    }

    const token = await deviceAuth.verify()

    if (token) {
      await setTokenInGlobalConfig(token)
      spinner.succeed('Logged in')
    } else {
      spinner.fail('Login failed')
      this.log()
      errorAndExit(this, 'LoginFailed', 'Login failed')
    }
  }
}
