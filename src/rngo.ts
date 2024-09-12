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
import { InsufficientPreviewVolumeError, DeviceType } from './gql/graphql'
import {
  CompileSimulationError,
  InitError,
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

export type ConfigFile = { id: string; branch?: string }
export type ConfigFileError = { path: string[]; message: string }

export type SimulationError =
  | {
      type: 'InsufficientPreviewVolume'
      message: string
      requiredMbs: number
      availableMbs: number
    }
  | {
      type: 'SimulationError'
      message: string
    }

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
          code: 'invalidOption',
          key: 'apiToken',
          message: `${key} is ${result.val}`,
        })
      }
    } else {
      errors.push({
        code: 'missingOption',
        key: 'apiToken',
        message: `Neither apiToken nor RNGO_API_TOKEN was specified`,
      })
    }

    if (
      options.configFilePath &&
      !rngoUtil.fileExists(options.configFilePath)
    ) {
      errors.push({
        code: 'invalidOption',
        key: 'configFilePath',
        message: `configPath '${options.configFilePath}' not found`,
      })
    }

    let directory = options.directory || this.defaultDirectoryPath()
    let configFilePath =
      options.configFilePath || this.defaultConfigFilePath(directory)
    let config: ConfigFileSource

    if (await rngoUtil.fileExists(configFilePath)) {
      const source = await rngoUtil.readFile(configFilePath)
      let yaml

      try {
        yaml = YAML.parse(source!, { intAsBigInt: true })
      } catch (error) {
        const message = options.configFilePath
          ? `Error parsing YAML at configFilePath '${configFilePath}': ${error}`
          : `Error parsing YAML at default config file path '${configFilePath}': ${error}`

        errors.push({
          code: 'invalidOption',
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
            __typename
            ... on Simulation {
              id
            }
            ... on SimulationCompileFailure {
              configFileSource {
                jsonPointer
                message
              }
            }
          }
        }
      `),
      {
        input: {
          ...args,
          configFileSource: this.configFileSource,
        },
      }
    )

    if (compileLocalSimulation.__typename == 'Simulation') {
      const compileErrors = await this.#getSimulationCompileErrors(
        compileLocalSimulation.id
      )

      if (compileErrors) {
        return Err(compileErrors)
      } else {
        return Ok(compileLocalSimulation.id)
      }
    } else {
      const issues = (compileLocalSimulation.configFileSource || []).map(
        (issue) => {
          return {
            code: 'invalidConfig' as const,
            jsonPointer: issue.jsonPointer,
            message: issue.message,
          }
        }
      )

      if (issues.length > 0) {
        return Err(issues)
      } else {
        throw new Error(
          `Unhandled GraphQL error: ${JSON.stringify(compileLocalSimulation)}`
        )
      }
    }
  }

  /**
   * Idempotently inserts and / or update any systems, scenarios or streams
   * specified in the local config file to the rngo API. This should be called
   * after changes to the local config file to ensure that future simulations
   * reference the latest state.
   *
   * @returns The ID of the created config file resource.
   */
  async pushConfigFile(): Promise<Result<ConfigFile, ConfigFileError[]>> {
    const scmRepo = await rngoUtil.getScmRepo()

    const { pushConfigFile } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodePushConfigFile($input: PushConfigFile!) {
          pushConfigFile(input: $input) {
            __typename
            ... on ConfigFile {
              id
              branch {
                name
              }
            }
            ... on PushConfigFileFailure {
              config {
                path
                message
              }
            }
            ... on SynchronizationError {
              message
            }
          }
        }
      `),
      {
        input: {
          source: this.configFileSource,
          branch: scmRepo?.branch,
        },
      }
    )

    if (pushConfigFile.__typename == 'ConfigFile') {
      const mergeResult = await rngoUtil.poll(async () => {
        const { configFile } = await this.gqlClient.request(
          gql(/* GraphQL */ `
            query nodePollConfigFile($id: String!) {
              configFile(id: $id) {
                mergeResult {
                  __typename
                  ... on ConfigFileMergeFailure {
                    errors {
                      message
                    }
                  }
                }
              }
            }
          `),
          {
            id: pushConfigFile.id,
          }
        )

        if (configFile?.mergeResult) {
          return configFile.mergeResult
        }
      })

      if (mergeResult) {
        if (mergeResult.__typename == 'MergedConfigFile') {
          return Ok({
            id: pushConfigFile.id,
            branch: pushConfigFile.branch?.name,
          })
        } else {
          const configFileErrors = mergeResult.errors.map((error) => {
            return { message: error.message, path: [] }
          })
          return Err(configFileErrors)
        }
      } else {
        throw new Error(`Config file processing timed out`)
      }
    } else if (pushConfigFile.__typename == 'PushConfigFileFailure') {
      return Err(pushConfigFile.config || [])
    } else {
      return Err([{ message: pushConfigFile.message, path: [] }])
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
            __typename
            ... on Simulation {
              id
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

    if (compileGlobalSimulation.__typename == 'Simulation') {
      const compileErrors = await this.#getSimulationCompileErrors(
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

  async #getSimulationCompileErrors(
    id: string
  ): Promise<CompileSimulationError[] | undefined> {
    const compileResult = await rngoUtil.poll(async () => {
      const { simulation } = await this.gqlClient.request(
        gql(/* GraphQL */ `
          query nodePollSimulation($id: String!) {
            simulation(id: $id) {
              compileResult {
                __typename
                ... on SimulationCompileFailure {
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

      if (simulation?.compileResult) {
        return simulation.compileResult
      }
    })

    if (compileResult) {
      if (compileResult.__typename == 'CompiledSimulation') {
        return undefined
      } else {
        const errors: CompileSimulationError[] = []

        if (compileResult.scenario) {
          compileResult.scenario.forEach((issue) => {
            errors.push({
              code: 'invalidCompileArg',
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
  ): Promise<Result<FileSink, SimulationError[]>> {
    const { runSimulationToFile } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {
          runSimulationToFile(input: $input) {
            __typename
            ... on FileSink {
              id
            }
            ... on RunSimulationToFileValidationError {
              simulationId {
                message
              }
            }
            ... on InsufficientPreviewVolumeError {
              message
              availableMbs
              requiredMbs
            }
            ... on Error {
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
      runSimulationToFile.__typename === 'RunSimulationToFileValidationError' &&
      runSimulationToFile.simulationId
    ) {
      return Err(
        runSimulationToFile.simulationId.map((e) => {
          return { type: 'SimulationError', message: e.message }
        })
      )
    } else if (
      runSimulationToFile.__typename === 'InsufficientPreviewVolumeError'
    ) {
      const error = runSimulationToFile as InsufficientPreviewVolumeError
      return Err([
        {
          type: 'InsufficientPreviewVolume',
          ...error,
        },
      ])
    } else if (runSimulationToFile.__typename === 'CapacityError') {
      return Err([
        { type: 'SimulationError', message: runSimulationToFile.message },
      ])
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
