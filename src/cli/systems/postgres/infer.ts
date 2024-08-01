import TsResult, { Result } from 'ts-results'

import { LocalConfig } from '@cli/config'
import { InferArgs, InferError } from '@cli/systems'

import { buildParameters, tableInfoToStreams } from './parse'
import { TableInfo, pgHelper } from './query'
import { z } from 'zod'

const { Err, Ok } = TsResult

export async function infer(
  args: InferArgs
): Promise<Result<LocalConfig, InferError[]>> {
  const parametersResult = buildParameters(args)

  if (parametersResult.ok) {
    try {
      const tableInfo: TableInfo[] = await pgHelper(parametersResult.val)
      return Ok({ streams: tableInfoToStreams(tableInfo, args.systemName) })
    } catch (e) {
      const result = z
        .object({
          code: z.string().default(''),
          message: z.string().default(''),
        })
        .safeParse(e)

      if (result.success) {
        if (
          result.data.code === 'ECONNREFUSED' ||
          result.data.message.includes('Connection terminated unexpectedly')
        ) {
          return Err([
            { message: `Could not connect to system '${args.systemName}'` },
          ])
        }
      }

      return Err([
        {
          message: `Error when inspecting '${args.systemName}': ${e}`,
        },
      ])
    }
  } else {
    return parametersResult
  }
}
