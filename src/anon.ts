import { GraphQLClient } from 'graphql-request'
import JSONbig from 'json-bigint'
import TsResult, { Result } from 'ts-results'

import * as rngoUtil from './util'
import { gql } from './gql/gql'
import { AuthCliMutation } from './gql/graphql'
import { InitError } from './util'

const { Err, Ok } = TsResult

type DeviceAuthRecord = AuthCliMutation['authCli']

export class AnonApiClient {
  gql: GraphQLClient

  constructor(apiUrl: URL) {
    this.gql = new GraphQLClient(`${apiUrl}/graphql`, {
      jsonSerializer: JSONbig({ useNativeBigInt: true }),
    })
  }

  async initiateDeviceAuth(): Promise<DeviceAuthRecord> {
    const { authCli } = await this.gql.request(
      gql(/* GraphQL */ `
        mutation AuthCli {
          authCli {
            cliCode
            userCode
            verificationUrl
          }
        }
      `)
    )

    return authCli
  }

  async verifyDeviceAuth(deviceCode: string): Promise<string | undefined> {
    const result = await this.gql.request(
      gql(/* GraphQL */ `
        query GetVerifiedCliAuth($cliCode: String!) {
          verifiedCliAuth(cliCode: $cliCode) {
            token
          }
        }
      `),
      {
        cliCode: deviceCode,
      }
    )

    return result.verifiedCliAuth?.token
  }
}

export class DeviceAuth {
  static async init(options?: {
    apiUrl: string
  }): Promise<Result<DeviceAuth, InitError>> {
    const apiUrlResult = rngoUtil.resolveApiUrl(options?.apiUrl)

    if (apiUrlResult.ok) {
      const client = new AnonApiClient(apiUrlResult.val)
      const record = await client.initiateDeviceAuth()
      return Ok(new DeviceAuth(client, record))
    } else {
      return Err(apiUrlResult.val)
    }
  }

  private client: AnonApiClient
  private cliCode: string
  userCode: string
  verificationUrl: string

  constructor(client: AnonApiClient, record: DeviceAuthRecord) {
    this.cliCode = record.cliCode
    this.userCode = record.userCode
    this.verificationUrl = record.verificationUrl
    this.client = client
  }

  async verify(): Promise<string | undefined> {
    const token = await rngoUtil.poll(async () => {
      return this.client.verifyDeviceAuth(this.cliCode)
    })

    return token
  }
}
