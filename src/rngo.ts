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
  ConfigFile,
  ConfigFileError,
  Sink,
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

    return this.client.syncConfig(this.config, gqlScm)
  }

  async awaitSimulationSink(
    simulationId: string,
    sinkId: string
  ): Promise<Sink | undefined> {
    return rngoUtil.poll(async () => {
      const simulation = await this.client.getSimulation(simulationId)

      if (simulation) {
        const sink = simulation.sinks.find((sink) => sink.id === sinkId)

        if (sink?.completedAt) {
          return sink
        }
      }
    })
  }

  async downloadFileSink(
    simulationId: string,
    fileSink: Sink
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
