import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import ora from 'ora'
import z from 'zod'

import { errorAndExit, getRngoOrExit, logUserErrors } from '@cli/util'
import convert from 'convert-units'

export default class Run extends Command {
  static summary = 'Run a new simulation and download the data.'

  static flags = {
    branch: Flags.string({ char: 'b' }),
    config: Flags.string({
      char: 'c',
      summary: 'Path to config file.',
    }),
    seed: Flags.string({
      char: 's',
      summary: 'Seed for the simulation.',
    }),
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
      errorAndExit(this, 'FlagInvalid', 'seed must be a positive integer')
    }

    const rngo = await getRngoOrExit(this, cmd.flags)

    const syncSpinner = ora('Syncing config').start()

    let branchId: string | undefined = undefined
    const syncConfigResult = await rngo.upsertConfigFile()

    if (syncConfigResult.ok) {
      syncSpinner.succeed()
      branchId = syncConfigResult.val.branchId
    } else {
      syncSpinner.fail()
      logUserErrors(this, syncConfigResult.val)
      errorAndExit(this, 'ConfigInvalid', 'The config is invalid')
    }

    const runSpinner = ora('Running simulation').start()

    const createSimulationResult = await rngo.createSimulation(
      branchId!,
      parsedSeed
    )

    let simulationId

    if (createSimulationResult.ok) {
      simulationId = createSimulationResult.val
    } else {
      runSpinner.fail()
      errorAndExit(
        this,
        'UnhandledError',
        `Unhandled error: ${createSimulationResult.val}`
      )
    }

    const drainResult = await rngo.drainSimulationToFile(simulationId)

    let sink

    if (drainResult.ok) {
      runSpinner.succeed()
      sink = drainResult.val
    } else {
      runSpinner.fail()

      const previewError = drainResult.val.find((error) => {
        return error.type === 'InsufficientPreviewVolume'
      })

      if (previewError) {
        if (previewError.type === 'InsufficientPreviewVolume') {
          const available = convert(previewError.availableBytes)
            .from('b')
            .toBest()

          const required = convert(previewError.requiredBytes)
            .from('b')
            .toBest()

          this.log()
          this.log(
            `You have ${chalk.bold(
              `${available.val} ${available.unit.toUpperCase()}`
            )} of preview volume available, but this simulation has a volume of ${chalk.bold(
              `${required.val} ${required.unit.toUpperCase()}`
            )}.
To proceed, go to ${chalk.yellow.bold(
              'https://rngo.dev/settings'
            )} and subscribe to a plan.`
          )
        }

        return this.exit()
      } else {
        errorAndExit(
          this,
          'UnhandledError',
          `Unhandled error: ${drainResult.val}`
        )
      }
    }

    const dowloadSpinner = ora('Downloading data').start()
    await rngo.downloadFileSink(simulationId, sink)
    dowloadSpinner.succeed()

    const importSpinner = ora('Importing data').start()

    if (sink.importScriptUrl) {
      await rngo.importSimulation(simulationId)
      importSpinner.succeed()
    } else {
      importSpinner.info('No import scripts found')
    }
  }
}
