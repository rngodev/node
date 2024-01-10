import { GraphQLClient } from 'graphql-request'
import JSONbig from 'json-bigint'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import TsResult, { Result } from 'ts-results'
import { z } from 'zod'

import { gql } from './gql/gql'
import {
  GetOrganizationsQuery,
  GetSimulationQuery,
  UpsertConfigFileScm,
} from './gql/graphql'
import { Config } from './rngo'

const { Err, Ok } = TsResult

export type ConfigFile = { id: string; branchId: string }
export type Organization = GetOrganizationsQuery['organizations'][number]
export { UpsertConfigFileScm }
export type NewSimulation = { id: string; defaultFileSinkId: string }
export type Simulation = NonNullable<GetSimulationQuery['simulation']>
export type Sink = NonNullable<
  NonNullable<GetSimulationQuery['simulation']>['sinks'][number]
>

const ApiErrorSchema = z.object({
  path: z.union([z.string(), z.number()]).array().optional(),
  message: z.string(),
})

const ApiErrorResponseSchema = z.object({
  response: z.object({
    errors: ApiErrorSchema.array(),
  }),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

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

  async getOrganizations(): Promise<Organization[]> {
    const { organizations } = await this.gql.request(
      gql(/* GraphQL */ `
        query getOrganizations {
          organizations {
            id
            name
            createdAt
          }
        }
      `)
    )

    return organizations
  }

  async syncConfig(
    config: Config,
    scm: UpsertConfigFileScm | undefined
  ): Promise<Result<ConfigFile, ApiError[]>> {
    try {
      const { upsertConfigFile } = await this.gql.request(
        gql(/* GraphQL */ `
          mutation upsertConfigFile($input: UpsertConfigFile!) {
            upsertConfigFile(input: $input) {
              id
              branch {
                id
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

      return Ok({
        id: upsertConfigFile.id,
        branchId: upsertConfigFile.branch.id,
      })
    } catch (raw) {
      const gqlResult = ApiErrorResponseSchema.parse(raw)

      return Err(gqlResult.response.errors)
    }
  }

  async runSimulation(
    branchId: string,
    seed: number | undefined
  ): Promise<NewSimulation> {
    const { createSimulation } = await this.gql.request(
      gql(/* GraphQL */ `
        mutation createSimulation($input: CreateSimulation!) {
          createSimulation(input: $input) {
            id
            sinks {
              id
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

    return {
      id: createSimulation.id,
      defaultFileSinkId: createSimulation.sinks[0].id,
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
}
