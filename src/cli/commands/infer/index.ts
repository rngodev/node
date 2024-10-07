import { Command } from '@oclif/core'
import chalk from 'chalk'
import ora, { Ora } from 'ora'

import {
  LocalConfig,
  getConfigUpdateCommandsForMerge,
  updateConfig,
} from '@cli/config'
import { inferConfigFromSystem, inferFunctionForSystem } from '@cli/systems'
import {
  failSpinners,
  getConfigOrExit,
  getRngoOrExit,
  printCaughtError,
  printErrorAndExit,
} from '@cli/util'

export default class Infer extends Command {
  static summary = 'Infer configuration.'

  async catch(error: unknown) {
    failSpinners(this, this.spinners)
    printCaughtError(this, error)
  }

  spinners: Record<string, Ora> = {}

  public async run(): Promise<void> {
    const rngo = await getRngoOrExit(this)
    const config = await getConfigOrExit(this, rngo)

    if (config.systems) {
      const systems: Record<string, LocalConfig> = {}

      for (const [systemName, system] of Object.entries(config.systems)) {
        this.spinners[`analyze${systemName}`] = ora(`Analyzing ${systemName}`)
        this.spinners[`analyze${systemName}`].start()

        if (!inferFunctionForSystem(system)) {
          this.spinners[`analyze${systemName}`].warn(
            `No inference script found for ${systemName}`
          )
        } else {
          const result = await inferConfigFromSystem(
            systemName,
            system,
            process.env
          )

          if (result.ok) {
            this.spinners[`analyze${systemName}`].succeed()
            systems[systemName] = result.val
          } else {
            failSpinners(this, this.spinners)

            printErrorAndExit(this, result.val)
          }
        }
      }

      this.spinners.calculating = ora('Calculating config updates')

      const spinner = this.spinners.calculating.start()
      const commands = getConfigUpdateCommandsForMerge(config, systems)
      spinner.succeed()

      if (commands.length > 0) {
        this.log('\nUpdating the config:')
        commands.forEach((command) => {
          if (command.type == 'addObjectProperty') {
            this.log(
              ` - adding property ${chalk.yellow.bold(
                command.path.join('/')
              )} to stream ${chalk.yellow.bold(command.streamName)}`
            )
          } else if (command.type === 'addStream') {
            this.log(
              ` - adding stream ${chalk.yellow.bold(command.streamName)}`
            )
          } else if (command.type === 'replaceStreamSchema') {
            this.log(
              ` - replacing schema for stream ${chalk.yellow.bold(
                command.streamName
              )}`
            )
          }
        })

        updateConfig(rngo.configFilePath, commands)
      } else {
        this.log(`\nNo config updates needed`)
      }
    }
  }
}
