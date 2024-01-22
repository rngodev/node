import { Command, Flags } from '@oclif/core'
import ora from 'ora'
import z from 'zod'

import { errorAndExit, getRngoOrExit, logUserErrors } from '@cli/util'

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
    const syncConfigResult = await rngo.syncConfig()

    if (syncConfigResult.ok) {
      syncSpinner.succeed()
      branchId = syncConfigResult.val.branchId
    } else {
      syncSpinner.fail()
      logUserErrors(this, syncConfigResult.val)
      errorAndExit(this, 'ConfigInvalid', 'The config is invalid')
    }

    const runSpinner = ora('Running simulation').start()

    const runSimulationResult = await rngo.client.runSimulation(
      branchId!,
      parsedSeed
    )

    let simulationId
    let sink

    if (runSimulationResult.ok) {
      simulationId = runSimulationResult.val.id
      sink = await rngo.awaitSimulationSink(
        runSimulationResult.val.id,
        runSimulationResult.val.defaultFileSinkId
      )

      if (!sink) {
        runSpinner.fail()
        errorAndExit(this, 'SimTimedOut', 'Simulation timed out')
      } else {
        runSpinner.succeed()
      }
    } else {
      syncSpinner.fail()
      errorAndExit(
        this,
        'UnhandledError',
        `Unhandled error: ${runSimulationResult.val}`
      )
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
