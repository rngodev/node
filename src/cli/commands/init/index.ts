import { Command } from '@oclif/core'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { Document, YAMLMap } from 'yaml'
import { z } from 'zod'

import * as rngoUtil from '@util'

import { getRngoOrExit } from '@cli/util'

type Choices = {
  organizationId: string
  systemTypes: ('redis' | 'postgres')[]
}

export default class Init extends Command {
  static description = 'Initialize this repo for rngo'

  async run() {
    const rngo = await getRngoOrExit(this)

    if (await rngoUtil.fileExists(rngo.configPath)) {
      this.log(chalk.bold('This repo has already been initialized'))
      this.log(
        `To add a new system, run: ${chalk.yellow.bold('rngo system add')}`
      )
      this.log(`Or, edit ${chalk.yellow.bold(rngo.configPath)} directly`)
      this.log()
      this.log(
        `See ${chalk.yellow.bold('https://rngo.dev/docs/cli/conf')} for details`
      )
      this.exit()
    }

    const orgs = await rngo.client.getOrganizations()

    const rawChoices = await inquirer.prompt([
      {
        name: 'organizationId',
        type: 'list',
        message: 'Which organization does this repo belong to?',
        when: orgs.length > 1,
        choices: orgs.map((org) => {
          return { name: org.name, value: org.id }
        }),
      },
      {
        type: 'checkbox',
        name: 'systemTypes',
        message: 'Where does this repo store its data?',
        choices: [
          {
            name: 'PostgreSQL',
            value: 'postgres',
          },
          {
            name: 'Redis',
            value: 'redis',
          },
        ],
      },
    ])

    const choices = z
      .object({
        organizationId: z.string().cuid().optional(),
        systemTypes: z.enum(['postgres', 'redis']).array(),
      })
      .transform((val) => {
        return {
          ...val,
          organizationId: val.organizationId || orgs[0].id,
        }
      })
      .parse(rawChoices)

    rngoUtil.writeFile(rngo.configPath, configDocument(choices).toString())

    this.log()
    this.log(chalk.bold('Initialized the repo for rngo'))
    const object =
      choices.systemTypes.length > 1 ? 'the systems' : choices.systemTypes[0]
    this.log(
      `Finish configuring ${object} directly in ${chalk.yellow.bold(
        rngo.configPath
      )}`
    )
    this.log(
      `To generate an initial simulation config, run: ${chalk.yellow.bold(
        'rngo conf create'
      )}`
    )
  }
}

export function configDocument(choices: Choices): Document {
  const doc = new Document({})

  const orgIdKey = doc.createNode('organizationId')
  orgIdKey.commentBefore = ` To change organizations, run 'rngo org set'`
  doc.set(orgIdKey, choices.organizationId)

  const scenariosKey = doc.createNode('scenarios')
  scenariosKey.commentBefore = ` change this`
  scenariosKey.spaceBefore = true
  doc.set(scenariosKey, {
    seed: 1,
    start: '1 week ago',
  })

  if (choices.systemTypes.length > 0) {
    const systems = new YAMLMap()

    choices.systemTypes.forEach((st) => {
      if (st === 'postgres') {
        systems.add({
          key: 'postgres',
          value: {
            type: 'postgres',
            host: {
              env: 'POSTGRES_HOST',
              default: 'localhost',
            },
            port: {
              env: 'POSTGRES_PORT',
              default: 5432,
            },
            user: {
              env: 'POSTGRES_USER',
            },
            password: {
              env: 'POSTGRES_PASSWORD',
            },
            database: {
              env: 'POSTGRES_DATABASE',
            },
            schema: {
              env: 'POSTGRES_SCHEMA',
              default: 'public',
            },
          },
        })
      } else if (st === 'redis') {
        systems.add({
          key: 'redis',
          value: {
            type: 'redis',
            host: {
              env: 'REDIS_HOST',
              default: 'localhost',
            },
            port: {
              env: 'REDIS_PORT',
              default: 6379,
            },
            password: {
              env: 'REDIS_PASSWORD',
            },
          },
        })
      }
    })

    const systemsKey = doc.createNode('systems')
    systemsKey.commentBefore =
      ' See https://rngo.dev/docs/cli/config for system config details'
    systemsKey.spaceBefore = true

    doc.set(systemsKey, systems)
  }

  return doc
}
