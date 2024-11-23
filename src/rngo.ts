import { GraphQLClient } from 'graphql-request'
import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import nodeUtil from 'node:util'
import TsResult, { Result } from 'ts-results'
import YAML from 'yaml'
import { z } from 'zod'

import * as rngoUtil from './util'
import { gql } from './gql/gql'
import { DeviceType } from './gql/graphql'
import {
  GeneralError,
  InsufficientVolumeError,
  InvalidArgError,
  InvalidConfigError,
  InvalidEnvVarError,
  MissingArgError,
  ValidJwtToken,
  jsonPathParts,
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
  metadataUrl?: string
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
  | InvalidEnvVarError<'RNGO_API_TOKEN' | 'RNGO_API_URL'>
  | InvalidConfigError

export type CompileSimulationError =
  | InvalidConfigError
  | InvalidArgError<'branch' | 'scenario' | 'seed' | 'start' | 'end'>
  | GeneralError

export type RunSimulationError = InsufficientVolumeError | GeneralError

export type PublishConfigFileError = InvalidConfigError | GeneralError

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
        if (options.apiToken) {
          errors.push({
            code: 'invalidArg',
            key: 'apiToken',
            message: `apiToken is ${result.val}`,
          })
        } else {
          errors.push({
            code: 'invalidEnvVar',
            envVar: 'RNGO_API_TOKEN',
            message: `RNGO_API_TOKEN is ${result.val}`,
          })
        }
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
              path: zodIssue.path,
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
      jsonSerializer: rngoUtil.JsonSerde,
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
          }
        }
      `),
      {
        input: {
          source: rngoUtil.JsonSerde.stringify(this.configFileSource),
          branch: scmRepo?.branch,
        },
      }
    )

    const publicationResult = await rngoUtil.poll(async () => {
      const { configFilePublication } = await this.gqlClient.request(
        gql(/* GraphQL */ `
          query nodePollConfigFilePublication($id: ID!) {
            configFilePublication(id: $id) {
              result {
                __typename
                ... on ConfigFile {
                  key
                  branch {
                    name
                  }
                }
                ... on Failure {
                  issues {
                    __typename
                    message
                    path
                  }
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

    if (publicationResult) {
      if (publicationResult.__typename == 'ConfigFile') {
        return Ok({
          key: publicationResult.key,
          branch: publicationResult.branch?.name,
        })
      } else {
        const configFileErrors = publicationResult.issues.map((issue) => {
          const path = issue.path ? jsonPathParts(issue.path) : undefined

          if (path && path[0] === 'source') {
            return {
              code: 'invalidConfig' as const,
              message: issue.message,
              path: path.slice(1),
            }
          }

          return {
            code: 'general' as const,
            message: issue.message,
            path,
          }
        })

        return Err(configFileErrors)
      }
    } else {
      throw new Error(`Config file processing timed out`)
    }
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
          }
        }
      `),
      {
        input: {
          ...args,
          configFileSource: rngoUtil.JsonSerde.stringify(this.configFileSource),
        },
      }
    )

    return this.#pollSimulationCompilation(compileLocalSimulation.id)
  }

  async compileGlobalSimulation(args: {
    branch?: string
    scenario?: string
    seed?: number
    start?: string
    end?: string
    streams?: string[]
  }): Promise<Result<string, CompileSimulationError[]>> {
    const { compileGlobalSimulation } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {
          compileGlobalSimulation(input: $input) {
            id
          }
        }
      `),
      {
        input: args,
      }
    )

    return this.#pollSimulationCompilation(compileGlobalSimulation.id)
  }

  async #pollSimulationCompilation(
    id: string
  ): Promise<Result<string, CompileSimulationError[]>> {
    const compileResult = await rngoUtil.poll(async () => {
      const { simulationCompilation } = await this.gqlClient.request(
        gql(/* GraphQL */ `
          query nodePollSimulationCompilation($id: ID!) {
            simulationCompilation(id: $id) {
              result {
                __typename
                ... on Simulation {
                  id
                }
                ... on Failure {
                  issues {
                    __typename
                    message
                    path
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
        return Ok(compileResult.id)
      } else {
        const errors = compileResult.issues.map((issue) => {
          const path = issue.path ? jsonPathParts(issue.path) : undefined

          if (path) {
            const argPathPartResult = z
              .enum(['scenario', 'branch', 'seed', 'start', 'end'])
              .safeParse(path[0])

            if (argPathPartResult.success) {
              return {
                code: 'invalidArg' as const,
                key: argPathPartResult.data,
                message: issue.message,
              }
            } else {
              if (path[0] === 'configFileSource') {
                return {
                  code: 'invalidConfig' as const,
                  path: path.slice(1),
                  message: issue.message,
                }
              }
            }
          }

          return {
            code: 'general' as const,
            message: issue.message,
            path,
          }
        })

        return Err(errors)
      }
    } else {
      // TODO: make a real Error for this
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
            ... on Failure {
              issues {
                __typename
                message
                path
                ... on PreviewVolumeIssue {
                  availableUnits
                  requiredUnits
                }
              }
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
                    metadataUrl
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
          metadataUrl: completedSink.metadataUrl || undefined,
          archives: completedSink.archives,
        })
      } else {
        throw new Error(`Drain simulation to file timed out`)
      }
    } else {
      const errors = runSimulationToFile.issues.map((issue) => {
        if (issue.__typename === 'PreviewVolumeIssue') {
          return {
            code: 'insufficientVolume' as const,
            requiredUnits: issue.requiredUnits,
            availableUnits: issue.availableUnits,
          }
        }

        return {
          code: 'general' as const,
          message: issue.message,
          path: issue.path ? jsonPathParts(issue.path) : undefined,
        }
      })

      return Err(errors)
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

    if (fileSink.metadataUrl) {
      await rngoUtil.downloadUrl(fileSink.metadataUrl, simulationDir)
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

  async importSimulation(
    simulationId: string
  ): Promise<Result<{ stdout: string; stderr: string }, GeneralError[]>> {
    const directory = this.simulationDir(simulationId)

    try {
      const out = await nodeUtil.promisify(execFile)('./import.sh', {
        cwd: directory,
      })

      return Ok(out)
    } catch (error) {
      return Err([
        {
          code: 'general' as const,
          message: `Simulation import script failed`,
          details: error instanceof Error ? error.message : undefined,
        },
      ])
    }
  }
}
