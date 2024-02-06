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
import { UpsertConfigFileScm } from './gql/graphql'
import { InitError, ValidJwtToken } from './util'

const { Err, Ok } = TsResult

const ConfigSchema = z.object({}).passthrough()
export type Config = z.infer<typeof ConfigSchema>

export type RngoOptions = {
  apiToken: string
  apiUrl: string
  configPath?: string
  directory?: string
}

type ParsedRngoOptions = {
  apiToken: ValidJwtToken
  apiUrl: URL
  config: Config
  configPath: string
  directory: string
}

export type ConfigFile = { id: string; branchId: string }
export type ConfigFileError = { path: string[]; message: string }

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
      const { authCli } = await gqlClient.request(
        gql(/* GraphQL */ `
          mutation authCli {
            authCli {
              cliCode
              userCode
              verificationUrl
            }
          }
        `)
      )

      return Ok({
        userCode: authCli.userCode,
        verificationUrl: authCli.verificationUrl,
        verify: async () => {
          const token = await rngoUtil.poll(async () => {
            const result = await gqlClient.request(
              gql(/* GraphQL */ `
                query getVerifiedCliAuth($cliCode: String!) {
                  verifiedCliAuth(cliCode: $cliCode) {
                    token
                  }
                }
              `),
              {
                cliCode: authCli.cliCode,
              }
            )

            return result.verifiedCliAuth?.token
          })

          return token
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
          message: `${key} is ${result.err}`,
        })
      }
    } else {
      errors.push({
        code: 'missingOption',
        key: 'apiToken',
        message: `Neither apiToken nor RNGO_API_TOKEN was specified`,
      })
    }

    if (options.configPath && !rngoUtil.fileExists(options.configPath)) {
      errors.push({
        code: 'invalidOption',
        key: 'configPath',
        message: `configPath '${options.configPath}' not found`,
      })
    }

    let directory = options.directory || this.defaultDirectoryPath()
    let configPath = options.configPath || this.defaultConfigFilePath(directory)
    let config: Config

    if (await rngoUtil.fileExists(configPath)) {
      const source = await rngoUtil.readFile(configPath)
      let yaml

      try {
        yaml = YAML.parse(source!, { intAsBigInt: true })
      } catch (error) {
        const message = options.configPath
          ? `Error parsing YAML at configPath '${options.configPath}': ${error}`
          : `Error parsing YAML at default path '${options.configPath}': ${error}`

        errors.push({
          code: 'invalidOption',
          key: 'configPath',
          message,
        })
      }

      if (yaml) {
        const result = ConfigSchema.safeParse(yaml)

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
        config: config!,
        configPath,
        directory,
      })
    )
  }

  config: Config
  configPath: string
  directory: string
  apiUrl: URL
  gqlClient: GraphQLClient

  constructor(options: ParsedRngoOptions, gqlClient?: GraphQLClient) {
    this.config = options.config
    this.configPath = options.configPath
    this.directory = options.directory
    this.apiUrl = options.apiUrl
    this.gqlClient =
      gqlClient ||
      new GraphQLClient(`${options.apiUrl}/graphql`, {
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

  async syncConfig(): Promise<Result<ConfigFile, ConfigFileError[]>> {
    let gqlScm: UpsertConfigFileScm | undefined = undefined
    const scmRepo = await rngoUtil.getScmRepo()

    if (scmRepo) {
      gqlScm = {
        repo: scmRepo.name,
        branch: scmRepo.branch,
        parentCommit: scmRepo.commitHash,
        filepath: this.configPath,
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
                id
              }
            }
            ... on UpsertConfigFileFailure {
              config {
                path
                message
              }
            }
          }
        }
      `),
      {
        input: {
          config: this.config,
          scm: gqlScm,
        },
      }
    )

    if (upsertConfigFile.__typename == 'ConfigFile') {
      return Ok({
        id: upsertConfigFile.id,
        branchId: upsertConfigFile.branch.id,
      })
    } else {
      return Err(upsertConfigFile.config || [])
    }
  }

  async createSimulation(
    branchId: string,
    seed: number | undefined
  ): Promise<Result<string, string[]>> {
    const { createSimulation } = await this.gqlClient.request(
      gql(/* GraphQL */ `
        mutation createSimulation($input: CreateSimulation!) {
          createSimulation(input: $input) {
            __typename
            ... on Simulation {
              id
            }
            ... on CreateSimulationFailure {
              branchId {
                message
              }
            }
          }
        }
      `),
      {
        // TODO: 1. pass in spec name, once server knows about specs
        // 2. overrides come from CLI args
        input: {
          branchId,
          seed,
          // seed: spec?.seed,
          // start: spec?.start,
          // end: spec?.end,
        },
      }
    )

    if (createSimulation.__typename == 'Simulation') {
      return Ok(createSimulation.id)
    } else if (createSimulation.branchId) {
      // return Err(createSimulation.branchId.map((e) => e.message))))
      return Err(['Unknown branchId'])
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(createSimulation)}`
      )
    }
  }

  async drainSimulationToFile(
    simulationId: string
  ): Promise<Result<FileSink, string[]>> {
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
      return Ok({
        id: drainSimulationToFile.id,
        simulationId: simulationId,
        importScriptUrl: drainSimulationToFile.importScriptUrl || undefined,
        archives: drainSimulationToFile.archives,
      })
    } else if (
      drainSimulationToFile.__typename ==
        'DrainSimulationToFileValidationError' &&
      drainSimulationToFile.simulationId
    ) {
      return Err(drainSimulationToFile.simulationId.map((e) => e.message))
    } else if (
      drainSimulationToFile.__typename == 'PaymentError' ||
      drainSimulationToFile.__typename == 'CapacityError'
    ) {
      return Err([drainSimulationToFile.message])
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(drainSimulationToFile)}`
      )
    }
  }

  async waitForDrainedSink(
    simulationId: string,
    sinkId: string
  ): Promise<boolean> {
    const result = await rngoUtil.poll(async () => {
      const { simulation } = await this.gqlClient.request(
        gql(/* GraphQL */ `
          query getSimulation($id: String!) {
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
        const sink = simulation?.sinks.find((sink) => sink.id === sinkId)

        if (sink?.completedAt) {
          return true
        }
      }
    })

    return result || false
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
function JSONbig(arg0: {
  useNativeBigInt: boolean
}): import('graphql-request/build/esm/types.dom').JsonSerializer | undefined {
  throw new Error('Function not implemented.')
}
