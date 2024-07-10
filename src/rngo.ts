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
import {
  InsufficientPreviewVolumeError,
  UpsertConfigFileScm,
} from './gql/graphql'
import { InitError, ValidJwtToken } from './util'

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
  static async authDevice(options?: {
    apiUrl: string
  }): Promise<Result<DeviceAuth, InitError>> {
    const apiUrlResult = rngoUtil.resolveApiUrl(options?.apiUrl)

    if (apiUrlResult.ok) {
      const gqlClient = new GraphQLClient(apiUrlResult.val.toString())
      const { authDevice } = await gqlClient.request(
        gql(/* GraphQL */ `
          mutation authDevice {
            authDevice {
              deviceCode
              userCode
              verificationUrl
            }
          }
        `)
      )

      return Ok({
        userCode: authDevice.userCode,
        verificationUrl: authDevice.verificationUrl,
        verify: async () => {
          const result = await gqlClient.request(
            gql(/* GraphQL */ `
              query getVerifiedDeviceAuth($deviceCode: String!) {
                verifiedDeviceAuth(deviceCode: $deviceCode) {
                  token
                }
              }
            `),
            {
              deviceCode: authDevice.deviceCode,
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
              path: zodIssue.path,
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

  /**
   * Idempotently inserts and / or update any systems, scenarios or streams
   * specified in the local config file to the rngo API. This should be called
   * after changes to the local config file to ensure that future simulations
   * reference the latest state.
   *
   * @returns The ID of the created config file resource.
   */
  async upsertConfigFile(): Promise<Result<ConfigFile, ConfigFileError[]>> {
    let gqlScm: UpsertConfigFileScm | undefined = undefined
    const scmRepo = await rngoUtil.getScmRepo()

    if (scmRepo) {
      gqlScm = {
        repo: scmRepo.name,
        branch: scmRepo.branch,
        parentCommit: scmRepo.commitHash,
        filepath: this.configFilePath,
      }
    }

    const { upsertConfigFile } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation upsertConfigFile($input: UpsertConfigFile!) {
          upsertConfigFile(input: $input) {
            __typename
            ... on ConfigFile {
              id
              branch {
                name
              }
              processingCompletedAt
            }
            ... on UpsertConfigFileFailure {
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
          scm: gqlScm,
        },
      }
    )

    if (upsertConfigFile.__typename == 'ConfigFile') {
      const result = await rngoUtil.poll(async () => {
        const { configFile } = await this.gqlClient.request(
          gql(/* GraphQL */ `
            query pollConfigFile($id: String!) {
              configFile(id: $id) {
                processingCompletedAt
              }
            }
          `),
          {
            id: upsertConfigFile.id,
          }
        )

        if (configFile?.processingCompletedAt) {
          return true
        }
      })

      if (result) {
        return Ok({
          id: upsertConfigFile.id,
          branch: upsertConfigFile.branch?.name,
        })
      } else {
        throw new Error(`Config file processing timed out`)
      }
    } else if (upsertConfigFile.__typename == 'UpsertConfigFileFailure') {
      return Err(upsertConfigFile.config || [])
    } else {
      return Err([{ message: upsertConfigFile.message, path: [] }])
    }
  }

  async createSimulation(
    branch?: string,
    scenario?: string,
    seed?: number,
    start?: string,
    end?: string,
    streams?: string[]
  ): Promise<Result<string, string[]>> {
    const { createSimulation } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation createSimulation($input: CreateSimulation!) {
          createSimulation(input: $input) {
            __typename
            ... on Simulation {
              id
            }
          }
        }
      `),
      {
        // TODO: 1. pass in spec name, once server knows about specs
        // 2. overrides come from CLI args
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

    if (createSimulation.__typename == 'Simulation') {
      const result = await rngoUtil.poll(async () => {
        const { simulation } = await this.gqlClient.request(
          gql(/* GraphQL */ `
            query pollSimulation($id: String!) {
              simulation(id: $id) {
                processingCompletedAt
              }
            }
          `),
          {
            id: createSimulation.id,
          }
        )

        if (simulation?.processingCompletedAt) {
          return true
        }
      })

      if (result) {
        return Ok(createSimulation.id)
      } else {
        throw new Error(`Simulation processing timed out`)
      }
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(createSimulation)}`
      )
    }
  }

  async drainSimulationToFile(
    simulationId: string
  ): Promise<Result<FileSink, SimulationError[]>> {
    const { drainSimulationToFile } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation drainSimulationToFile($input: DrainSimulationToFile!) {
          drainSimulationToFile(input: $input) {
            __typename
            ... on FileSink {
              id
              importScriptUrl
              archives {
                url
              }
            }
            ... on DrainSimulationToFileValidationError {
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

    if (drainSimulationToFile.__typename == 'FileSink') {
      const result = await rngoUtil.poll(async () => {
        const { simulation } = await this.gqlClient.request(
          gql(/* GraphQL */ `
            query pollSimulationSinks($id: String!) {
              simulation(id: $id) {
                id
                sinks {
                  id
                  completedAt
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
            (sink) => sink.id === drainSimulationToFile.id
          )

          if (sink?.completedAt) {
            return true
          }
        }
      })

      if (result) {
        return Ok({
          id: drainSimulationToFile.id,
          simulationId: simulationId,
          importScriptUrl: drainSimulationToFile.importScriptUrl || undefined,
          archives: drainSimulationToFile.archives,
        })
      } else {
        throw new Error(`Drain simulation to file timed out`)
      }
    } else if (
      drainSimulationToFile.__typename ===
        'DrainSimulationToFileValidationError' &&
      drainSimulationToFile.simulationId
    ) {
      return Err(
        drainSimulationToFile.simulationId.map((e) => {
          return { type: 'SimulationError', message: e.message }
        })
      )
    } else if (
      drainSimulationToFile.__typename === 'InsufficientPreviewVolumeError'
    ) {
      const error = drainSimulationToFile as InsufficientPreviewVolumeError
      return Err([
        {
          type: 'InsufficientPreviewVolume',
          ...error,
        },
      ])
    } else if (drainSimulationToFile.__typename === 'CapacityError') {
      return Err([
        { type: 'SimulationError', message: drainSimulationToFile.message },
      ])
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(drainSimulationToFile)}`
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
