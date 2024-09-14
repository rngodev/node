import { Command } from '@oclif/core'
import chalk from 'chalk'
import ora from 'ora'

import {
  LocalConfig,
  getConfigUpdateCommandsForMerge,
  updateConfig,
} from '@cli/config'
import { inferConfigFromSystem, inferFunctionForSystem } from '@cli/systems'
import { getConfigOrExit, getRngoOrExit, printErrorAndExit } from '@cli/util'

export default class Infer extends Command {
  static summary = 'Infer configuration.'

  public async run(): Promise<void> {
    const rngo = await getRngoOrExit(this)
    const config = await getConfigOrExit(this, rngo)

    if (config.systems) {
      const systems: Record<string, LocalConfig> = {}

      for (const [systemName, system] of Object.entries(config.systems)) {
        const spinner = ora(`Analyzing ${systemName}`).start()

        if (!inferFunctionForSystem(system)) {
          spinner.warn(`No inference script found for ${systemName}`)
        } else {
          const result = await inferConfigFromSystem(
            systemName,
            system,
            process.env
          )

          if (result.ok) {
            spinner.succeed()
            systems[systemName] = result.val
          } else {
            spinner.fail()

            printErrorAndExit(this, result.val)
          }
        }
      }

      const spinner = ora('Calculating config updates').start()
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
