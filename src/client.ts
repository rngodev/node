import { GraphQLClient } from 'graphql-request'
import JSONbig from 'json-bigint'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import TsResult, { Result } from 'ts-results'

import { gql } from './gql/gql'
import { Simulation, UpsertConfigFileScm } from './gql/graphql'
import { Config } from './rngo'

const { Err, Ok } = TsResult

export type ConfigFile = { id: string; branchId: string }
export type ConfigFileError = { path: string[]; message: string }
export { UpsertConfigFileScm }
export type NewSimulation = { id: string; defaultFileSinkId: string }
export type Sink = NonNullable<Simulation['sinks'][number]>
export type NewSink = { id: string; simulationId: string }

export type ValidToken = {
  token: string
  expirationDate: Date
}

export type TokenError = 'missing' | 'expired' | 'malformed'

export type ParsedToken = Result<ValidToken, TokenError>

export function parseToken(token: string | undefined): ParsedToken {
  if (token) {
    const decodedJwt = jwt.decode(token) as JwtPayload

    if (decodedJwt.exp) {
      const expirationDate = new Date(decodedJwt.exp * 1000)

      if (expirationDate > new Date()) {
        return Ok({ token: token, expirationDate })
      } else {
        return Err('expired')
      }
    } else {
      return Err('malformed')
    }
  } else {
    return Err('missing')
  }
}

export class ApiClient {
  gql: GraphQLClient

  constructor(apiUrl: URL, validToken: ValidToken) {
    this.gql = new GraphQLClient(`${apiUrl}/graphql`, {
      jsonSerializer: JSONbig({ useNativeBigInt: true }),
      headers: {
        authorization: `Bearer ${validToken.token}`,
        'auth-provider': 'clerk',
      },
    })
  }

  async syncConfig(
    config: Config,
    scm: UpsertConfigFileScm | undefined
  ): Promise<Result<ConfigFile, ConfigFileError[]>> {
    const { upsertConfigFile } = await this.gql.request(
      gql(/* GraphQL */ `
        mutation upsertConfigFile($input: UpsertConfigFile!) {
          upsertConfigFile(input: $input) {
            __typename
            ... on ConfigFile {
              id
              branch {
                id
              }
            }
            ... on UpsertConfigFileFailure {
              config {
                path
                message
              }
            }
          }
        }
      `),
      {
        input: {
          config,
          scm,
        },
      }
    )

    if (upsertConfigFile.__typename == 'ConfigFile') {
      return Ok({
        id: upsertConfigFile.id,
        branchId: upsertConfigFile.branch.id,
      })
    } else {
      return Err(upsertConfigFile.config || [])
    }
  }

  async createSimulation(
    branchId: string,
    seed: number | undefined
  ): Promise<Result<NewSimulation, string[]>> {
    const { createSimulation } = await this.gql.request(
      gql(/* GraphQL */ `
        mutation createSimulation($input: CreateSimulation!) {
          createSimulation(input: $input) {
            __typename
            ... on Simulation {
              id
              sinks {
                id
              }
            }
            ... on CreateSimulationFailure {
              branchId {
                message
              }
            }
          }
        }
      `),
      {
        // TODO: 1. pass in spec name, once server knows about specs
        // 2. overrides come from CLI args
        input: {
          branchId,
          seed,
          // seed: spec?.seed,
          // start: spec?.start,
          // end: spec?.end,
        },
      }
    )

    if (createSimulation.__typename == 'Simulation') {
      return Ok({
        id: createSimulation.id,
        defaultFileSinkId: createSimulation.sinks[0].id,
      })
    } else {
      if (createSimulation.branchId) {
        // return Err(createSimulation.branchId.map((e) => e.message))))
        return Err(['Unknown branchId'])
      } else {
        throw new Error(
          `Unhandled GraphQL error: ${JSON.stringify(createSimulation)}`
        )
      }
    }
  }

  async getSimulation(simulationId: string): Promise<Simulation | undefined> {
    const { simulation } = await this.gql.request(
      gql(/* GraphQL */ `
        query getSimulation($id: String!) {
          simulation(id: $id) {
            id
            sinks {
              id
              completedAt
              ... on FileSink {
                importScriptUrl
                archives {
                  url
                }
              }
            }
          }
        }
      `),
      {
        id: simulationId,
      }
    )

    if (simulation === null) {
      return undefined
    } else {
      return simulation
    }
  }

  async drainSimulationToFile(
    simulationId: string
  ): Promise<Result<NewSink, string[]>> {
    const { drainSimulationToFile } = await this.gql.request(
      gql(/* GraphQL */ `
        mutation drainSimulationToFile($input: DrainSimulationToFile!) {
          drainSimulationToFile(input: $input) {
            __typename
            ... on FileSink {
              id
            }
            ... on DrainSimulationToFileValidationError {
              simulationId {
                message
              }
            }
            ... on Error {
              message
            }
          }
        }
      `),
      {
        input: {
          simulationId,
        },
      }
    )

    if (drainSimulationToFile.__typename == 'FileSink') {
      return Ok({
        id: drainSimulationToFile.id,
        simulationId: simulationId,
      })
    } else if (
      drainSimulationToFile.__typename ==
        'DrainSimulationToFileValidationError' &&
      drainSimulationToFile.simulationId
    ) {
      return Err(drainSimulationToFile.simulationId.map((e) => e.message))
    } else if (
      drainSimulationToFile.__typename == 'PaymentError' ||
      drainSimulationToFile.__typename == 'CapacityError'
    ) {
      return Err([drainSimulationToFile.message])
    } else {
      throw new Error(
        `Unhandled GraphQL error: ${JSON.stringify(drainSimulationToFile)}`
      )
    }
  }
}
