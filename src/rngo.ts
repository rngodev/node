import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import nodeUtil from 'node:util'
import TsResult, { Result } from 'ts-results'
import YAML from 'yaml'
import { z } from 'zod'

import * as rngoUtil from './util'
import {
  ApiClient,
  ApiError,
  ConfigFile,
  Simulation,
  UpsertConfigFileScm,
  ValidToken,
  parseToken,
} from './client'
import { InitError } from './util'

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
  apiToken: ValidToken
  apiUrl: URL
  config: Config
  configPath: string
  directory: string
}

export class Rngo {
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
    let apiToken: ValidToken

    if (rawToken) {
      const result = parseToken(rawToken)

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

    let directory = options.directory || path.join('.', '.rngo')
    let configPath = options.configPath || path.join(directory, 'config.yml')
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
  client: ApiClient

  constructor(options: ParsedRngoOptions) {
    this.config = options.config
    this.configPath = options.configPath
    this.directory = options.directory
    this.client = new ApiClient(options.apiUrl, options.apiToken)
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

  async syncConfig(): Promise<Result<ConfigFile, ApiError[]>> {
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

    return this.client.syncConfig(this.config, gqlScm)
  }

  async awaitSimulation(simulationId: string): Promise<Simulation | undefined> {
    return rngoUtil.poll(async () => {
      const simulation = await this.client.getSimulation(simulationId)

      if (simulation?.completedAt) {
        return simulation
      }
    })
  }

  async downloadSimulation(simulation: Simulation): Promise<string> {
    const exists = await rngoUtil.fileExists(this.simulationsDir)

    if (!exists) {
      await fs.mkdir(this.simulationsDir, { recursive: true })
    }

    const simulationDir = path.join(this.simulationsDir, simulation.id)

    await Promise.all(
      simulation.streams.map(async (simulationStream) => {
        const streamName = simulationStream.streamVersion.stream.name
        const outputDir = path.join(simulationDir, streamName)

        await rngoUtil.downloadUrl(simulationStream.metadataUrl, outputDir)

        await Promise.all(
          simulationStream.outputs.map(async (output) => {
            await rngoUtil.downloadUrl(output.dataUrl, outputDir)
          })
        )

        await Promise.all(
          simulationStream.systems.flatMap((system) => {
            return system.scriptUrls.map(async (scriptUrl) => {
              const filepath = await rngoUtil.downloadUrl(scriptUrl, outputDir)
              await fs.chmod(filepath, 0o755)
              return filepath
            })
          })
        )
      })
    )

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

  async importSimulation(simulation: Simulation) {
    const directory = this.simulationDir(simulation.id)

    await Promise.all(
      simulation.streams.flatMap((simulationStream) => {
        return simulationStream.systems.flatMap((simulationStreamSystem) => {
          const streamName = simulationStream.streamVersion.stream.name
          const systemName = simulationStreamSystem.systemVersion.system.name

          return nodeUtil.promisify(execFile)('./import.sh', {
            cwd: path.join(directory, streamName, systemName),
          })
        })
      })
    )
  }
}
