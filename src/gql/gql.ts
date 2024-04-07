/* eslint-disable */
import * as types from './graphql.js';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n          mutation authDevice {\n            authDevice {\n              deviceCode\n              userCode\n              verificationUrl\n            }\n          }\n        ": types.AuthDeviceDocument,
    "\n              query getVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            ": types.GetVerifiedDeviceAuthDocument,
    "\n        mutation upsertConfigFile($input: UpsertConfigFile!) {\n          upsertConfigFile(input: $input) {\n            __typename\n            ... on ConfigFile {\n              id\n              branch {\n                id\n              }\n            }\n            ... on UpsertConfigFileFailure {\n              config {\n                path\n                message\n              }\n            }\n          }\n        }\n      ": types.UpsertConfigFileDocument,
    "\n            query pollConfigFile($id: String!) {\n              configFile(id: $id) {\n                processingCompletedAt\n              }\n            }\n          ": types.PollConfigFileDocument,
    "\n        mutation createSimulation($input: CreateSimulation!) {\n          createSimulation(input: $input) {\n            __typename\n            ... on Simulation {\n              id\n            }\n            ... on CreateSimulationFailure {\n              branchId {\n                message\n              }\n            }\n          }\n        }\n      ": types.CreateSimulationDocument,
    "\n            query pollSimulation($id: String!) {\n              simulation(id: $id) {\n                processingCompletedAt\n              }\n            }\n          ": types.PollSimulationDocument,
    "\n        mutation drainSimulationToFile($input: DrainSimulationToFile!) {\n          drainSimulationToFile(input: $input) {\n            __typename\n            ... on FileSink {\n              id\n              importScriptUrl\n              archives {\n                url\n              }\n            }\n            ... on DrainSimulationToFileValidationError {\n              simulationId {\n                message\n              }\n            }\n            ... on InsufficientPreviewCreditsError {\n              message\n              available\n              required\n            }\n            ... on Error {\n              message\n            }\n          }\n        }\n      ": types.DrainSimulationToFileDocument,
    "\n            query pollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                }\n              }\n            }\n          ": types.PollSimulationSinksDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n          mutation authDevice {\n            authDevice {\n              deviceCode\n              userCode\n              verificationUrl\n            }\n          }\n        "): (typeof documents)["\n          mutation authDevice {\n            authDevice {\n              deviceCode\n              userCode\n              verificationUrl\n            }\n          }\n        "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n              query getVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            "): (typeof documents)["\n              query getVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation upsertConfigFile($input: UpsertConfigFile!) {\n          upsertConfigFile(input: $input) {\n            __typename\n            ... on ConfigFile {\n              id\n              branch {\n                id\n              }\n            }\n            ... on UpsertConfigFileFailure {\n              config {\n                path\n                message\n              }\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation upsertConfigFile($input: UpsertConfigFile!) {\n          upsertConfigFile(input: $input) {\n            __typename\n            ... on ConfigFile {\n              id\n              branch {\n                id\n              }\n            }\n            ... on UpsertConfigFileFailure {\n              config {\n                path\n                message\n              }\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query pollConfigFile($id: String!) {\n              configFile(id: $id) {\n                processingCompletedAt\n              }\n            }\n          "): (typeof documents)["\n            query pollConfigFile($id: String!) {\n              configFile(id: $id) {\n                processingCompletedAt\n              }\n            }\n          "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation createSimulation($input: CreateSimulation!) {\n          createSimulation(input: $input) {\n            __typename\n            ... on Simulation {\n              id\n            }\n            ... on CreateSimulationFailure {\n              branchId {\n                message\n              }\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation createSimulation($input: CreateSimulation!) {\n          createSimulation(input: $input) {\n            __typename\n            ... on Simulation {\n              id\n            }\n            ... on CreateSimulationFailure {\n              branchId {\n                message\n              }\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query pollSimulation($id: String!) {\n              simulation(id: $id) {\n                processingCompletedAt\n              }\n            }\n          "): (typeof documents)["\n            query pollSimulation($id: String!) {\n              simulation(id: $id) {\n                processingCompletedAt\n              }\n            }\n          "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation drainSimulationToFile($input: DrainSimulationToFile!) {\n          drainSimulationToFile(input: $input) {\n            __typename\n            ... on FileSink {\n              id\n              importScriptUrl\n              archives {\n                url\n              }\n            }\n            ... on DrainSimulationToFileValidationError {\n              simulationId {\n                message\n              }\n            }\n            ... on InsufficientPreviewCreditsError {\n              message\n              available\n              required\n            }\n            ... on Error {\n              message\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation drainSimulationToFile($input: DrainSimulationToFile!) {\n          drainSimulationToFile(input: $input) {\n            __typename\n            ... on FileSink {\n              id\n              importScriptUrl\n              archives {\n                url\n              }\n            }\n            ... on DrainSimulationToFileValidationError {\n              simulationId {\n                message\n              }\n            }\n            ... on InsufficientPreviewCreditsError {\n              message\n              available\n              required\n            }\n            ... on Error {\n              message\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query pollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                }\n              }\n            }\n          "): (typeof documents)["\n            query pollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                }\n              }\n            }\n          "];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;