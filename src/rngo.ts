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
  apiUrl: URL
  client: ApiClient

  constructor(options: ParsedRngoOptions) {
    this.config = options.config
    this.configPath = options.configPath
    this.directory = options.directory
    this.apiUrl = options.apiUrl
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

  async awaitSimulationFileSink(
    simulationId: string
  ): Promise<Simulation | undefined> {
    return rngoUtil.poll(async () => {
      const simulation = await this.client.getSimulation(simulationId)

      if (simulation) {
        if (simulation.sinks[0]?.completedAt) {
          return simulation
        }
      }
    })
  }

  async downloadSimulation(
    simulation: Simulation
  ): Promise<string | undefined> {
    const exists = await rngoUtil.fileExists(this.simulationsDir)

    if (!exists) {
      await fs.mkdir(this.simulationsDir, { recursive: true })
    }

    const fileSink = simulation.sinks[0]
    // const fileSink = simulation.sinks.find(
    //   (sink) => sink.__typename === 'FileSink'
    // )

    if (fileSink) {
      const simulationDir = path.join(this.simulationsDir, simulation.id)
      const dataDir = path.join(simulationDir, 'data')

      await Promise.all(
        fileSink.archives.map(async (archive) => {
          await rngoUtil.downloadUrl(archive.url, dataDir)
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
  }

  async importSimulation(simulation: Simulation) {
    const directory = this.simulationDir(simulation.id)

    return nodeUtil.promisify(execFile)('./import.sh', {
      cwd: directory,
    })
  }
}
