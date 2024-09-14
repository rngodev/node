import { Command, Errors } from '@oclif/core'
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
import { InferError } from './systems'

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
        if (initError.code == 'invalidArg' && initError.key === 'apiToken') {
          printMessageAndExit(
            command,
            `Your rngo API session has expired, please login again by running: ${chalk.yellow.bold(
              'rngo auth'
            )}`
          )
        } else if (initError.code === 'invalidArg') {
          printMessageAndExit(command, 'Unable to initiate rngo')
        }
      })
    }
  } else {
    printMessageAndExit(
      command,
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
  let errors: rngoUtil.GeneralError[] = []
  let config: LocalConfig
  const narrowResult = LocalConfigSchema.safeParse(rngo.configFileSource)

  if (narrowResult.success) {
    config = narrowResult.data
  } else {
    errors = narrowResult.error.issues.map((zodIssue) => {
      return {
        code: 'general',
        message: zodIssue.message,
        path: zodIssue.path,
      }
    })
  }

  if (errors.length > 0) {
    printErrorAndExit(command, errors)
  }

  return config!
}

export function printCaughtError(command: Command, error: unknown): void {
  if (error instanceof Errors.CLIError) {
    command.log(error.message)
  }
}

export function printMessageAndExit(command: Command, message: string): never {
  command.log(message)
  process.exit(1)
}

type PrintableError =
  | rngoUtil.GeneralError
  | rngoUtil.InvalidArgError<string>
  | rngoUtil.MissingArgError<string>
  | rngoUtil.InvalidConfigError
  | InferError

export function printErrorAndExit(
  command: Command,
  errors: PrintableError[]
): never {
  if (errors.length > 1) {
    command.log(chalk.red.bold(pluralize('error', errors.length, true)))

    errors.forEach((error) => {
      command.log(`  ${formatError(error)}`)
    })
  } else if (errors.length === 1) {
    command.log(formatError(errors[0]))
  }

  process.exit(1)
}

function formatError(error: PrintableError): string {
  let prefix: string | undefined = undefined

  if (error.code === 'invalidArg') {
    prefix = `'${error.key}' flag`
  }

  if (prefix) {
    return `${chalk.dim(prefix)}: ${error.message}`
  } else {
    return error.message
  }
}
