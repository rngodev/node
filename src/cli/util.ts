import { Command } from '@oclif/core'
import chalk from 'chalk'
import { promises as fs } from 'fs'
import { homedir } from 'os'
import path from 'path'
import pluralize from 'pluralize'
import YAML from 'yaml'
import { z } from 'zod'

import * as rngoUtil from '@util'
import { Rngo } from '@main'

import { LocalConfig, LocalConfigSchema } from '@cli/config'
import { CliError, ErrorCode, arrayToJsonPath } from '@cli/error'

export function getGlobalConfigPath() {
  return path.join(homedir(), '.rngo', 'config.yml')
}

export async function getGlobalConfig() {
  const globalConfigSchema = z.object({
    token: z.string().optional(),
  })

  const configSource = await rngoUtil.readFile(getGlobalConfigPath())

  if (configSource) {
    return globalConfigSchema.parse(YAML.parse(configSource))
  } else {
    return { token: undefined }
  }
}

export async function setTokenInGlobalConfig(token: string | undefined) {
  const globalConfigPath = getGlobalConfigPath()

  if (!(await rngoUtil.fileExists(globalConfigPath))) {
    await fs.mkdir(globalConfigPath, { recursive: true })
  }

  const globalConfig = await getGlobalConfig()

  fs.writeFile(
    globalConfigPath,
    YAML.stringify({
      ...globalConfig,
      token,
    })
  )
}

export async function getRngoOrExit(
  command: Command,
  flags?: { config?: string }
): Promise<Rngo> {
  const globalConfig = await getGlobalConfig()
  let rngo: Rngo

  if (globalConfig.token) {
    const result = await Rngo.init({
      apiToken: globalConfig.token,
      configFilePath: flags?.config,
    })

    if (result.ok) {
      rngo = result.val
    } else {
      result.val.forEach((initError) => {
        if (initError.code == 'invalidOption' && initError.key === 'apiToken') {
          errorAndExit(
            command,
            'SessionExpected',
            `Your rngo API session has expired, please login again by running: ${chalk.yellow.bold(
              'rngo auth'
            )}`
          )
        } else if (initError.code === 'invalidConfig') {
          errorAndExit(command, 'RngoInitFailed', 'Unable to initiate rngo')
        }
      })
    }
  } else {
    errorAndExit(
      command,
      'SessionExpected',
      `To get started, first log into the rngo API by running: ${chalk.yellow.bold(
        'rngo auth'
      )}`
    )
  }

  return rngo!
}

export async function getConfigOrExit(
  command: Command,
  rngo: Rngo
): Promise<LocalConfig> {
  let errors: CliError[] = []
  let config: LocalConfig
  const narrowResult = LocalConfigSchema.safeParse(rngo.configFileSource)

  if (narrowResult.success) {
    config = narrowResult.data
  } else {
    errors = narrowResult.error.issues.map((zodIssue) => {
      return {
        message: zodIssue.message,
        path: zodIssue.path,
      }
    })
  }

  if (errors.length > 0) {
    logUserErrors(command, errors)
    errorAndExit(command, 'ConfigInvalid', 'Config is invalid')
  }

  return config!
}

export function errorAndExit(
  command: Command,
  code: ErrorCode,
  message: string,
  suggestions?: string[]
): never {
  return command.error(message, {
    code,
    suggestions,
    exit: 1,
    ref: `https://rngo.dev/cliErrors#${code}`,
  })
}

export function logUserErrors(command: Command, errors: CliError[]) {
  command.log()
  command.log(chalk.red.bold(pluralize('error', errors.length, true)))
  command.log()

  errors.forEach((e) => {
    if (e.path) {
      const path = e.path.length > 0 ? arrayToJsonPath(e.path) : 'top-level'
      command.log(chalk.dim(`[${path}]`))
    }
    command.log(e.message)
    command.log()
  })
}
