import * as dotenv from 'dotenv'
import TsResult, { Result } from 'ts-results'

import { LocalConfig, System, SystemParameter } from '@cli/config'
import { infer as postgresInfer } from '@cli/systems/postgres/infer'

dotenv.config()

const { Err, Ok } = TsResult

export type InferArgs = {
  env: NodeJS.ProcessEnv
  namespaceName: string
  systemName: string
  system: System
}

export type InferError = {
  message: string
}

export type Infer = (
  args: InferArgs
) => Promise<Result<LocalConfig, InferError[]>>

export async function inferConfigFromSystem(
  systemName: string,
  system: System,
  env: NodeJS.ProcessEnv
): Promise<Result<LocalConfig, InferError[]>> {
  let errors: InferError[] = []
  let config: LocalConfig | undefined = undefined

  const fn = inferFunctionForSystem(system)

  if (fn) {
    const result = await fn({
      env,
      namespaceName: 'default',
      systemName,
      system,
    })

    if (result.ok) {
      config = result.val
    } else {
      errors = errors.concat(result.val)
    }
  } else {
    errors.concat({
      message: `Do not know how to infer from system '${systemName}'`,
    })
  }

  if (errors.length > 0) {
    return Err(errors)
  } else {
    return Ok(config!)
  }
}

export function inferFunctionForSystem(system: System): Infer | undefined {
  return {
    postgres: postgresInfer,
  }[system.type!]
}

export function getSystemParameter(
  env: NodeJS.ProcessEnv,
  namespaceName: string,
  systemName: string,
  parameterName: string,
  parameter?: SystemParameter
): string | undefined {
  if (parameter?.value) {
    return parameter.value
  }

  let envVar: string | undefined

  if (parameter?.env) {
    envVar = env[parameter.env]
  }

  if (!envVar) {
    envVar =
      env[
        `RNGO_${namespaceName.toUpperCase()}_${systemName.toUpperCase()}_${parameterName.toUpperCase()}`
      ]
  }

  if (!envVar) {
    envVar =
      env[`RNGO_${systemName.toUpperCase()}_${parameterName.toUpperCase()}`]
  }

  return envVar || parameter?.default
}
