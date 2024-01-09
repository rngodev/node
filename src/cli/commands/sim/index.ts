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
    const result = await rngo.syncConfig()

    if (result.ok) {
      syncSpinner.succeed()
      branchId = result.val.branchId
    } else {
      syncSpinner.fail()
      logUserErrors(this, result.val)
      errorAndExit(this, 'ConfigInvalid', 'The config is invalid')
    }

    const runSpinner = ora('Running simulation').start()

    // const specs = config.specs || {}
    // const spec = flags.branch ? specs[flags.branch] : specs['default']

    const simulationId = await rngo.client.runSimulation(branchId!, parsedSeed)
    const simulation = await rngo.awaitSimulationFileSink(simulationId)

    if (!simulation) {
      runSpinner.fail()
      errorAndExit(this, 'SimTimedOut', 'Simulation timed out')
    } else {
      runSpinner.succeed()
    }

    const dowloadSpinner = ora('Downloading data').start()
    await rngo.downloadSimulation(simulation)
    dowloadSpinner.succeed()

    const importSpinner = ora('Importing data').start()

    const shouldImport = simulation.sinks.some((sink) => {
      return sink.__typename === 'FileSink' && sink.importScriptUrl
    })

    if (shouldImport) {
      await rngo.importSimulation(simulation)
      importSpinner.succeed()
    } else {
      importSpinner.info('No import scripts found')
    }
  }
}
