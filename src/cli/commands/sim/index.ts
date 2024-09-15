import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import ora, { Ora } from 'ora'
import z from 'zod'

import {
  failSpinners,
  getRngoOrExit,
  printCaughtError,
  printErrorAndExit,
} from '@cli/util'

export default class Run extends Command {
  static summary = 'Run a new simulation and download the data.'

  async catch(error: unknown) {
    failSpinners(this, this.spinners)
    printCaughtError(this, error)
  }

  static flags = {
    config: Flags.string({
      char: 'c',
      summary: 'Path to config file.',
    }),
    branch: Flags.string({ char: 'b' }),
    scenario: Flags.string({
      char: 'c',
      summary: 'The name of the scenario to use for the simulation',
    }),
    seed: Flags.string({
      char: 'i',
      summary: 'Seed for the simulation.',
    }),
    start: Flags.string({
      char: 's',
      summary: 'When the simulation should start',
    }),
    end: Flags.string({
      char: 'e',
      summary: 'When the simulation should end',
    }),
    streams: Flags.string({
      char: 't',
      summary: 'The streams that should be included in the simulation',
      multiple: true,
    }),
  }

  spinners = {
    run: ora('Running simulation'),
    download: ora('Downloading data'),
    import: ora('Importing data'),
  }

  public async run(): Promise<void> {
    const cmd = await this.parse(Run)

    let parsedSeed: number | undefined = undefined
    const seedResult = z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .safeParse(cmd.flags.seed)

    if (seedResult.success) {
      parsedSeed = seedResult.data
    } else {
      printErrorAndExit(this, [
        {
          code: 'invalidArg',
          key: 'seed',
          message: 'seed must be a positive integer',
        },
      ])
    }

    const rngo = await getRngoOrExit(this, cmd.flags)

    this.spinners.run.start()

    const createSimulationResult = await rngo.compileLocalSimulation({
      scenario: cmd.flags.scenario,
      seed: parsedSeed,
      start: cmd.flags.start,
      end: cmd.flags.end,
    })

    let simulationId

    if (createSimulationResult.ok) {
      simulationId = createSimulationResult.val
    } else {
      failSpinners(this, this.spinners)
      printErrorAndExit(this, createSimulationResult.val)
    }

    const runSimulationResult = await rngo.runSimulationToFile(simulationId)

    let sink

    if (runSimulationResult.ok) {
      this.spinners.run.succeed()
      sink = runSimulationResult.val
    } else {
      failSpinners(this, this.spinners)

      const previewError = runSimulationResult.val.find((error) => {
        return error.code === 'insufficientVolume'
      })

      if (previewError) {
        if (previewError.code === 'insufficientVolume') {
          this.log()
          this.log(
            `You have ${chalk.bold(
              `${previewError.availableVolume} ${previewError.availableVolume > 1 ? 'MBs' : 'MB'}`
            )} of preview volume available, but this simulation has a volume of ${chalk.bold(
              `${previewError.requiredVolume} ${previewError.requiredVolume > 1 ? 'MBs' : 'MB'}`
            )}.
To proceed, go to ${chalk.yellow.bold(
              'https://rngo.dev/settings'
            )} and subscribe to a plan.`
          )
        }

        return this.exit()
      } else {
        printErrorAndExit(
          this,
          runSimulationResult.val.flatMap((error) => {
            if (error.code === 'general') {
              return [{ code: 'general', message: error.message }]
            } else {
              return []
            }
          })
        )
      }
    }

    this.spinners.download.start()
    await rngo.downloadFileSink(simulationId, sink)
    this.spinners.download.succeed()

    if (sink.importScriptUrl) {
      this.spinners.import.start()
      await rngo.importSimulation(simulationId)
      this.spinners.import.succeed()
    }
  }
}
