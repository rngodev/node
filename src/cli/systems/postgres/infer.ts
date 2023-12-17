import TsResult, { Result } from 'ts-results'

import { LocalConfig } from '@cli/config'
import { InferArgs, InferError } from '@cli/systems'

import { buildParameters, tableInfoToStreams } from './parse'
import { TableInfo, pgHelper } from './query'

const { Ok } = TsResult

export async function infer(
  args: InferArgs
): Promise<Result<LocalConfig, InferError[]>> {
  const parametersResult = buildParameters(args)

  if (parametersResult.ok) {
    const tableInfo: TableInfo[] = await pgHelper(parametersResult.val)
    return Ok({ streams: tableInfoToStreams(tableInfo, args.systemName) })
  } else {
    return parametersResult
  }
}
