import { parseDocument } from 'yaml'
import { z } from 'zod'

import * as rngoUtil from '@util'
import deepEqual from 'deep-equal'

const RngoProbabilitySchema = z.object({
  type: z.record(z.number().int()),
  properties: z.record(z.number().gte(0).lte(1)),
})

const RngoSchema = z.object({
  value: z.string().optional(),
  properties: RngoProbabilitySchema.optional(),
})

const SchemaTypeSchema = z.enum([
  'object',
  'array',
  'string',
  'integer',
  'number',
  'boolean',
  'null',
])

const BaseSchema = z.object({
  type: SchemaTypeSchema.or(z.array(SchemaTypeSchema)),
  enum: z.array(z.string()).optional(),
  rngo: RngoSchema.optional(),
  minLength: z.bigint().optional(),
  maxLength: z.bigint().optional(),
  format: z.string().optional(),
  minimum: z.bigint().optional(),
  maximum: z.bigint().optional(),
  required: z.array(z.string()).optional(),
})

export type Schema = z.infer<typeof BaseSchema> & {
  properties?: { [key: string]: Schema }
  items?: Schema
}

const SchemaSchema: z.ZodType<Schema> = BaseSchema.extend({
  properties: z.lazy(() => z.record(SchemaSchema).optional()),
  items: z.lazy(() => SchemaSchema.optional()),
})

const SystemParameterTypeSchema = z.enum(['integer'])

const SystemParameterSchema = z.object({
  value: z.string().optional(),
  env: z.string().optional(),
  default: z.string().optional(),
  required: z.boolean().optional(),
  type: SystemParameterTypeSchema.optional(),
})

const OutputSchema = z.object({
  format: z.enum(['json', 'csv']),
})

const SystemSchema = z.object({
  type: z.string().optional(),
  output: OutputSchema.optional(),
  parameters: z.record(SystemParameterSchema).optional(),
  scripts: z
    .object({
      preImport: z.string().optional(),
      import: z.string().optional(),
      postImport: z.string().optional(),
    })
    .optional(),
})

const StreamSystemSchema = z.object({
  parameters: z.record(z.string()).optional(),
})

const StreamSchema = z.object({
  output: OutputSchema.optional(),
  outputs: z.array(OutputSchema).optional(),
  systems: z.record(StreamSystemSchema).optional(),
  rate: z.string().optional(),
  schema: SchemaSchema,
})

export const LocalConfigSchema = z.object({
  organizationId: z.string().cuid().optional(),
  systems: z.record(SystemSchema).optional(),
  specs: z
    .record(
      z.object({
        seed: z.number().int().gte(0),
        start: z.string(),
        end: z.string().optional(),
      })
    )
    .optional(),
  streams: z.record(StreamSchema).optional().nullable(),
})

export type LocalConfig = z.infer<typeof LocalConfigSchema>
export type SchemaType = z.infer<typeof SchemaTypeSchema>
export type Stream = z.infer<typeof StreamSchema>
export type System = z.infer<typeof SystemSchema>
export type SystemParameter = z.infer<typeof SystemParameterSchema>

export type ConfigUpdateCommand =
  | {
      type: 'addObjectProperty'
      streamName: string
      path: (string | number)[]
      property: Schema
    }
  | {
      type: 'updateObjectProperty'
      streamName: string
      path: (string | number)[]
      oldProperty: Schema
      newProperty: Schema
    }
  | {
      type: 'addStream'
      streamName: string
      stream: Stream
    }
  | {
      type: 'replaceStreamSchema'
      streamName: string
      oldSchema: Schema
      newSchema: Schema
    }

export function getConfigUpdateCommandsForMerge(
  baseConfig: LocalConfig,
  newConfigs: Record<string, LocalConfig>,
  force: boolean = false
): ConfigUpdateCommand[] {
  let commands: ConfigUpdateCommand[] = []

  Object.entries(newConfigs).forEach(([key, newConfig]) => {
    Object.entries(newConfig.streams || {}).forEach(
      ([streamName, newStream]) => {
        let existingStream = (baseConfig.streams || {})[streamName]

        if (existingStream && !force) {
          if (existingStream.schema.properties) {
            if (newStream.schema.properties) {
              const existingProperties = existingStream.schema.properties
              Object.entries(newStream.schema.properties).forEach(
                ([propertyName, newProperty]) => {
                  const existingProperty = existingProperties[propertyName]

                  if (existingProperty) {
                    const mergedProperty = {
                      ...newProperty,
                      ...existingProperty,
                    }

                    console.log(mergedProperty)

                    if (!deepEqual(existingProperty, mergedProperty)) {
                      commands.push({
                        type: 'updateObjectProperty',
                        streamName,
                        path: [propertyName],
                        oldProperty: existingProperty,
                        newProperty: mergedProperty,
                      })
                    }
                  } else {
                    commands.push({
                      type: 'addObjectProperty',
                      streamName,
                      path: [propertyName],
                      property: newProperty,
                    })
                  }
                }
              )
            } else {
              commands.push({
                type: 'replaceStreamSchema',
                streamName,
                oldSchema: existingStream.schema,
                newSchema: newStream.schema,
              })
            }
          }
        } else {
          commands.push({ type: 'addStream', streamName, stream: newStream })
        }
      }
    )
  })

  return commands
}

export function applyConfigUpdateCommands(
  rawConfig: string,
  commands: ConfigUpdateCommand[]
): string {
  const doc = parseDocument(rawConfig)

  commands.forEach((command) => {
    if (command.type == 'addObjectProperty') {
      const path = [
        'streams',
        command.streamName,
        'schema',
        'properties',
        ...command.path,
      ]
      doc.setIn(path, command.property)
    } else if (command.type === 'updateObjectProperty') {
      const path = [
        'streams',
        command.streamName,
        'schema',
        'properties',
        ...command.path,
      ]
      doc.setIn(path, command.newProperty)
    } else if (command.type === 'addStream') {
      if (!doc.has('streams') || !doc.get('streams')) {
        doc.set('streams', doc.createNode({}))
      }

      doc.setIn(['streams', command.streamName], command.stream)
    }
  })

  return doc.toString()
}

export async function updateConfig(
  path: string,
  updateCommands: ConfigUpdateCommand[]
) {
  let source = await rngoUtil.readFile(path)

  if (!source) {
    rngoUtil.writeFile(path, '')
    source = ''
  }

  const newSource = applyConfigUpdateCommands(source, updateCommands)
  rngoUtil.writeFile(path, newSource)
}
