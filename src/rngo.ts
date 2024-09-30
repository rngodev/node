import { GraphQLClient } from 'graphql-request'
import JSONbig from 'json-bigint'
import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import nodeUtil from 'node:util'
import TsResult, { Result } from 'ts-results'
import YAML from 'yaml'
import { z } from 'zod'

import * as rngoUtil from './util'
import { gql } from './gql/gql'
import { PreviewVolumeIssue, DeviceType } from './gql/graphql'
import {
  GeneralError,
  InsufficientVolumeError,
  InvalidArgError,
  InvalidConfigError,
  MissingArgError,
  ValidJwtToken,
  buildJsonPointer,
} from './util'

const { Err, Ok } = TsResult

const ConfigFileSourceSchema = z.object({}).passthrough()
export type ConfigFileSource = z.infer<typeof ConfigFileSourceSchema>

export type RngoOptions = {
  apiToken: string
  apiUrl: string
  configFilePath?: string
  directory?: string
}

type ParsedRngoOptions = {
  apiToken: ValidJwtToken
  apiUrl: URL
  configFileSource: ConfigFileSource
  configFilePath: string
  directory: string
}

export type ConfigFile = { key: string; branch?: string }

export type NewSimulation = { id: string; defaultFileSinkId: string }

export type FileSink = {
  id: string
  simulationId: string
  importScriptUrl?: string
  archives: {
    url: string
  }[]
}

export type DeviceAuth = {
  userCode: string
  verificationUrl: string
  verify: () => Promise<string | undefined>
}

export type InitError =
  | InvalidArgError<keyof RngoOptions>
  | MissingArgError<keyof RngoOptions>
  | InvalidConfigError

export type CompileSimulationError =
  | InvalidConfigError
  | InvalidArgError<'branch' | 'scenario'>

export type RunSimulationError = InsufficientVolumeError | GeneralError

export type PublishConfigFileError = InvalidConfigError

export class Rngo {
  static async initiateDeviceAuth(options?: {
    deviceType?: 'cli'
    apiUrl?: string
  }): Promise<Result<DeviceAuth, InitError>> {
    const apiUrlResult = rngoUtil.resolveApiUrl(options?.apiUrl)

    if (apiUrlResult.ok) {
      let deviceType: DeviceType | undefined = undefined

      if (options?.deviceType) {
        deviceType = {
          cli: DeviceType.Cli,
        }[options.deviceType]
      }

      const gqlClient = new GraphQLClient(apiUrlResult.val.toString())
      const { initiateDeviceAuth } = await gqlClient.request(
        gql(/* GraphQL */ `
          mutation nodeInitiateDeviceAuth($input: InitiateDeviceAuth!) {
            initiateDeviceAuth(input: $input) {
              deviceCode
              userCode
              verificationUrl
            }
          }
        `),
        {
          input: {
            deviceType,
          },
        }
      )

      return Ok({
        userCode: initiateDeviceAuth.userCode,
        verificationUrl: initiateDeviceAuth.verificationUrl,
        verify: async () => {
          const result = await gqlClient.request(
            gql(/* GraphQL */ `
              query nodeGetVerifiedDeviceAuth($deviceCode: String!) {
                verifiedDeviceAuth(deviceCode: $deviceCode) {
                  token
                }
              }
            `),
            {
              deviceCode: initiateDeviceAuth.deviceCode,
            }
          )

          return result.verifiedDeviceAuth?.token
        },
      })
    } else {
      return Err(apiUrlResult.val)
    }
  }

  static defaultDirectoryPath() {
    return path.join(process.cwd(), '.rngo')
  }

  static defaultConfigFilePath(directory: string | undefined = undefined) {
    return path.join(directory || this.defaultDirectoryPath(), 'config.yml')
  }

  static async init(
    options: Partial<RngoOptions>
  ): Promise<Result<Rngo, InitError[]>> {
    const errors: InitError[] = []

    const apiUrlResult = rngoUtil.resolveApiUrl(options.apiUrl)

    let apiUrl: URL

    if (apiUrlResult.ok) {
      apiUrl = apiUrlResult.val
    } else {
      errors.push(apiUrlResult.val)
    }

    const rawToken = options.apiToken || process.env['RNGO_API_TOKEN']
    let apiToken: ValidJwtToken

    if (rawToken) {
      const result = rngoUtil.parseJwtToken(rawToken)

      if (result.ok) {
        apiToken = result.val
      } else {
        const key = options.apiUrl ? 'apiToken' : 'RNGO_API_TOKEN'
        errors.push({
          code: 'invalidArg',
          key: 'apiToken',
          message: `${key} is ${result.val}`,
        })
      }
    } else {
      errors.push({
        code: 'missingArg',
        key: 'apiToken',
        message: `Neither apiToken nor RNGO_API_TOKEN was specified`,
      })
    }

    if (
      options.configFilePath &&
      !(await rngoUtil.fileExists(options.configFilePath))
    ) {
      errors.push({
        code: 'invalidArg',
        key: 'configFilePath',
        message: `configFilePath '${options.configFilePath}' not found`,
      })
    }

    const directory = options.directory || this.defaultDirectoryPath()
    const configFilePath =
      options.configFilePath || this.defaultConfigFilePath(directory)
    const relativePath = path.relative(path.dirname(directory), configFilePath)
    let config: ConfigFileSource

    if (await rngoUtil.fileExists(configFilePath)) {
      const source = await rngoUtil.readFile(configFilePath)
      let yaml

      try {
        yaml = YAML.parse(source!, { intAsBigInt: true })
      } catch (error) {
        const message = options.configFilePath
          ? `Error parsing YAML at configFilePath '${relativePath}': ${error}`
          : `Error parsing YAML at default config file path '${relativePath}': ${error}`

        errors.push({
          code: 'invalidArg',
          key: 'configFilePath',
          message,
        })
      }

      if (yaml) {
        const result = ConfigFileSourceSchema.safeParse(yaml)

        if (result.success) {
          config = result.data
        } else {
          result.error.issues.map((zodIssue) => {
            errors.push({
              code: 'invalidConfig',
              jsonPointer: buildJsonPointer(zodIssue.path),
              message: zodIssue.message,
            })
          })
        }
      }
    } else if (options.configFilePath === undefined) {
      errors.push({
        code: 'missingArg',
        key: 'configFilePath',
        message: `configFilePath not specified and default path '${relativePath}' not found`,
      })
    }

    if (errors.length > 0) {
      return Err(errors)
    }

    return Ok(
      new Rngo({
        apiToken: apiToken!,
        apiUrl: apiUrl!,
        configFileSource: config!,
        configFilePath: configFilePath,
        directory,
      })
    )
  }

  configFileSource: ConfigFileSource
  configFilePath: string
  directory: string
  apiUrl: URL
  gqlClient: GraphQLClient

  constructor(options: ParsedRngoOptions) {
    this.configFileSource = options.configFileSource
    this.configFilePath = options.configFilePath
    this.directory = options.directory
    this.apiUrl = options.apiUrl
    this.gqlClient = new GraphQLClient(options.apiUrl.toString(), {
      jsonSerializer: JSONbig({ useNativeBigInt: true }),
      headers: {
        authorization: `Bearer ${options.apiToken.token}`,
        'auth-provider': 'clerk',
      },
    })
  }

  get lastSimulationDir() {
    return path.join(this.simulationsDir, 'last')
  }

  get simulationsDir() {
    return path.join(this.directory, 'simulations')
  }

  simulationDir(simulationId: string) {
    return path.join(this.simulationsDir, simulationId)
  }

  async compileLocalSimulation(args: {
    branch?: string
    scenario?: string
    seed?: number
    start?: string
    end?: string
  }): Promise<Result<string, CompileSimulationError[]>> {
    const { compileLocalSimulation } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodeCompileLocalSimulation($input: CompileLocalSimulation!) {
          compileLocalSimulation(input: $input) {
            id
            result {
              __typename
              ... on CompileSimulationFailure {
                configFileSource {
                  jsonPointer
                  issue {
                    message
                  }
                }
              }
            }
          }
        }
      `),
      {
        input: {
          ...args,
          configFileSource: JSON.stringify(this.configFileSource),
        },
      }
    )

    if (!compileLocalSimulation.result) {
      const compileErrors = await this.#getSimulationCompilationErrors(
        compileLocalSimulation.id
      )

      if (compileErrors) {
        return Err(compileErrors)
      } else {
        return Ok(compileLocalSimulation.id)
      }
    } else if (
      compileLocalSimulation.result.__typename === 'CompileSimulationFailure'
    ) {
      const issues = (compileLocalSimulation.result.configFileSource || []).map(
        (jsonIssue) => {
          return {
            code: 'invalidConfig' as const,
            jsonPointer: jsonIssue.jsonPointer,
            message: jsonIssue.issue.message,
          }
        }
      )

      if (issues.length > 0) {
        return Err(issues)
      }
    }

    throw new Error(
      `Unhandled GraphQL error: ${JSON.stringify(compileLocalSimulation)}`
    )
  }

  /**
   * Idempotently inserts and / or update any systems, scenarios or streams
   * specified in the local config file to the rngo API. This should be called
   * after changes to the local config file to ensure that future simulations
   * reference the latest state.
   *
   * @returns The ID of the created config file resource.
   */
  async publishConfigFile(): Promise<
    Result<ConfigFile, PublishConfigFileError[]>
  > {
    const scmRepo = await rngoUtil.getScmRepo()

    const { publishConfigFile } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodePublishConfigFile($input: PublishConfigFile!) {
          publishConfigFile(input: $input) {
            id
            result {
              __typename
              ... on PublishConfigFileSuccess {
                configFile {
                  key
                  branch {
                    name
                  }
                }
              }
              ... on PublishConfigFileFailure {
                source {
                  jsonPointer
                  issue {
                    message
                  }
                }
              }
              ... on ConcurrencyIssue {
                message
              }
            }
          }
        }
      `),
      {
        input: {
          source: JSON.stringify(this.configFileSource),
          branch: scmRepo?.branch,
        },
      }
    )

    let publicationResult = publishConfigFile.result

    if (!publicationResult) {
      publicationResult = await rngoUtil.poll(async () => {
        const { configFilePublication } = await this.gqlClient.request(
          gql(/* GraphQL */ `
            query nodePollConfigFilePublication($id: ID!) {
              configFilePublication(id: $id) {
                result {
                  __typename
                  ... on PublishConfigFileSuccess {
                    configFile {
                      key
                      branch {
                        name
                      }
                    }
                  }
                  ... on PublishConfigFileFailure {
                    source {
                      jsonPointer
                      issue {
                        message
                      }
                    }
                  }
                  ... on ConcurrencyIssue {
                    message
                  }
                }
              }
            }
          `),
          {
            id: publishConfigFile.id,
          }
        )

        if (configFilePublication?.result) {
          return configFilePublication.result
        }
      })
    }

    if (publicationResult) {
      if (publicationResult.__typename == 'PublishConfigFileSuccess') {
        return Ok({
          key: publicationResult.configFile.key,
          branch: publicationResult.configFile.branch?.name,
        })
      } else if (publicationResult.__typename == 'PublishConfigFileFailure') {
        const configFileErrors = publicationResult.source?.map((jsonIssue) => {
          return {
            code: 'invalidConfig' as const,
            message: jsonIssue.issue.message,
            jsonPointer: jsonIssue.jsonPointer,
          }
        })

        if (configFileErrors) {
          return Err(configFileErrors)
        }
      }

      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(publicationResult)}`
      )
    } else {
      throw new Error(`Config file processing timed out`)
    }
  }

  async compileGlobalSimulation(
    branch?: string,
    scenario?: string,
    seed?: number,
    start?: string,
    end?: string,
    streams?: string[]
  ): Promise<Result<string, CompileSimulationError[]>> {
    const { compileGlobalSimulation } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {
          compileGlobalSimulation(input: $input) {
            id
            result {
              __typename
            }
          }
        }
      `),
      {
        input: {
          branch,
          scenario,
          seed,
          start,
          end,
          streams,
        },
      }
    )

    if (!compileGlobalSimulation.result) {
      const compileErrors = await this.#getSimulationCompilationErrors(
        compileGlobalSimulation.id
      )

      if (compileErrors) {
        return Err(compileErrors)
      } else {
        return Ok(compileGlobalSimulation.id)
      }
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(compileGlobalSimulation)}`
      )
    }
  }

  async #getSimulationCompilationErrors(
    id: string
  ): Promise<CompileSimulationError[] | undefined> {
    const compileResult = await rngoUtil.poll(async () => {
      const { simulationCompilation } = await this.gqlClient.request(
        gql(/* GraphQL */ `
          query nodePollSimulationCompilation($id: ID!) {
            simulationCompilation(id: $id) {
              result {
                __typename
                ... on CompileSimulationFailure {
                  scenario {
                    message
                  }
                }
              }
            }
          }
        `),
        {
          id,
        }
      )

      if (simulationCompilation?.result) {
        return simulationCompilation.result
      }
    })

    if (compileResult) {
      if (compileResult.__typename == 'Simulation') {
        return undefined
      } else {
        const errors: CompileSimulationError[] = []

        if (compileResult.scenario) {
          compileResult.scenario.forEach((issue) => {
            errors.push({
              code: 'invalidArg',
              key: 'scenario',
              message: issue.message,
            })
          })
        }

        return errors.length > 0 ? errors : undefined
      }
    } else {
      throw new Error(`Simulation processing timed out`)
    }
  }

  async runSimulationToFile(
    simulationId: string
  ): Promise<Result<FileSink, RunSimulationError[]>> {
    const { runSimulationToFile } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {
          runSimulationToFile(input: $input) {
            __typename
            ... on FileSink {
              id
            }
            ... on RunSimulationToFileFailure {
              simulationId {
                message
              }
            }
            ... on PreviewVolumeIssue {
              message
              availableUnits
              requiredUnits
            }
            ... on Issue {
              message
            }
          }
        }
      `),
      {
        input: {
          simulationId,
        },
      }
    )

    if (runSimulationToFile.__typename == 'FileSink') {
      const completedSink = await rngoUtil.poll(async () => {
        const { simulation } = await this.gqlClient.request(
          gql(/* GraphQL */ `
            query nodePollSimulationSinks($id: String!) {
              simulation(id: $id) {
                id
                sinks {
                  id
                  completedAt
                  ... on FileSink {
                    id
                    importScriptUrl
                    archives {
                      url
                    }
                  }
                }
              }
            }
          `),
          {
            id: simulationId,
          }
        )

        if (simulation?.sinks) {
          const sink = simulation?.sinks.find(
            (sink) => sink.id === runSimulationToFile.id
          )

          if (sink?.completedAt) {
            return sink
          }
        }
      })

      if (completedSink) {
        return Ok({
          id: runSimulationToFile.id,
          simulationId: simulationId,
          importScriptUrl: completedSink.importScriptUrl || undefined,
          archives: completedSink.archives,
        })
      } else {
        throw new Error(`Drain simulation to file timed out`)
      }
    } else if (
      runSimulationToFile.__typename === 'RunSimulationToFileFailure' &&
      runSimulationToFile.simulationId
    ) {
      return Err(
        runSimulationToFile.simulationId.map((e) => {
          return { code: 'general', message: e.message }
        })
      )
    } else if (runSimulationToFile.__typename === 'PreviewVolumeIssue') {
      const error = runSimulationToFile as PreviewVolumeIssue
      return Err([
        {
          code: 'insufficientVolume',
          requiredUnits: error.requiredUnits,
          availableUnits: error.availableUnits,
        },
      ])
    } else if (runSimulationToFile.__typename === 'RngoCapacityIssue') {
      return Err([{ code: 'general', message: runSimulationToFile.message }])
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(runSimulationToFile)}`
      )
    }
  }

  async downloadFileSink(
    simulationId: string,
    fileSink: FileSink
  ): Promise<string | undefined> {
    const exists = await rngoUtil.fileExists(this.simulationsDir)

    if (!exists) {
      await fs.mkdir(this.simulationsDir, { recursive: true })
    }

    const simulationDir = path.join(this.simulationsDir, simulationId)

    await Promise.all(
      fileSink.archives.map(async (archive) => {
        const zipPath = await rngoUtil.downloadUrl(archive.url, simulationDir)
        await rngoUtil.unzip(zipPath, simulationDir)
        await fs.unlink(zipPath)
      })
    )

    if (fileSink.importScriptUrl) {
      const scriptPath = await rngoUtil.downloadUrl(
        fileSink.importScriptUrl,
        simulationDir
      )
      await fs.chmod(scriptPath, 0o755)
    }

    if (await rngoUtil.symlinkExists(this.lastSimulationDir)) {
      await fs.unlink(this.lastSimulationDir)
    }

    await fs.symlink(
      path.relative(path.dirname(this.lastSimulationDir), simulationDir),
      this.lastSimulationDir,
      'dir'
    )

    return simulationDir
  }

  async importSimulation(simulationId: string) {
    const directory = this.simulationDir(simulationId)

    return nodeUtil.promisify(execFile)('./import.sh', {
      cwd: directory,
    })
  }
}
