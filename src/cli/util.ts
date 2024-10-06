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
import { ClientError } from 'graphql-request'
import { Ora } from 'ora'

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

  if (globalConfig.token) {
    const apiToken = process.env.RNGO_API_TOKEN ? undefined : globalConfig.token

    const result = await Rngo.init({
      apiToken,
      configFilePath: flags?.config,
    })

    if (result.ok) {
      return result.val
    } else {
      const apiTokenError = result.val.find(
        (error) => error.code === 'invalidArg' && error.key === 'apiToken'
      )

      if (apiTokenError) {
        printMessageAndExit(
          command,
          `Your rngo session has expired. Log in again by running: ${chalk.yellow.bold(
            'rngo auth'
          )}`
        )
      } else {
        printErrorAndExit(command, result.val)
      }
    }
  } else {
    printMessageAndExit(
      command,
      `To get started, first log into the rngo by running: ${chalk.yellow.bold(
        'rngo auth'
      )}`
    )
  }
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

export function failSpinners(command: Command, spinners: Record<string, Ora>) {
  let wasSpinning = false

  Object.values(spinners).forEach((spinner) => {
    if (spinner.isSpinning) {
      spinner.fail()
      wasSpinning = true
    }
  })

  if (wasSpinning) {
    command.log()
  }
}

export function printCaughtError(command: Command, error: unknown): void {
  if (error instanceof Errors.CLIError) {
    command.logToStderr(error.message)
  } else if (error instanceof ClientError) {
    command.logToStderr(chalk.red('Unexpected error returned from API.'))
  } else if (error instanceof Error) {
    command.logToStderr(chalk.red('Unexpected error occurred'))
  }

  command.exit()
}

export function printMessageAndExit(command: Command, message: string): never {
  command.log(message)
  process.exit(1)
}

type PrintableError =
  | rngoUtil.GeneralError
  | rngoUtil.InvalidArgError<string>
  | rngoUtil.MissingArgError<string>
  | rngoUtil.InvalidEnvVarError<string>
  | rngoUtil.InvalidConfigError
  | InferError

export function printErrorAndExit(
  command: Command,
  errors: PrintableError[]
): never {
  errors.forEach((error, index) => {
    command.logToStderr(`${formatError(error)}`)
    if (index < errors.length - 1) {
      command.logToStderr()
    }
  })

  process.exit(1)
}

function formatError(error: PrintableError): string {
  let prefix: string = 'Error'

  if (error.code === 'invalidArg' || error.code === 'missingArg') {
    prefix = `'${error.key}' flag invalid`
  } else if (error.code === 'invalidEnvVar') {
    prefix = `Environment variable '${error.envVar}' invalid`
  } else if (error.code === 'invalidConfig') {
    prefix = `Config file invalid at ${rngoUtil.jsonPathFromParts(error.path)}`
  }

  let message = `${chalk.bold(prefix)}\n${error.message}`

  let details: string | undefined = undefined

  if (error.code === 'general') {
    details = error.details
  }

  if (details) {
    message += `\n${chalk.dim(details)}`
  }

  return message
}
