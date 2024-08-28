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
    "\n          mutation nodeInitiateDeviceAuth($input: InitiateDeviceAuth!) {\n            initiateDeviceAuth(input: $input) {\n              deviceCode\n              userCode\n              verificationUrl\n            }\n          }\n        ": types.NodeInitiateDeviceAuthDocument,
    "\n              query getVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            ": types.GetVerifiedDeviceAuthDocument,
    "\n        mutation nodePushConfigFile($input: PushConfigFile!) {\n          pushConfigFile(input: $input) {\n            __typename\n            ... on ConfigFile {\n              id\n              branch {\n                name\n              }\n            }\n            ... on PushConfigFileFailure {\n              config {\n                path\n                message\n              }\n            }\n            ... on SynchronizationError {\n              message\n            }\n          }\n        }\n      ": types.NodePushConfigFileDocument,
    "\n            query nodePollConfigFile($id: String!) {\n              configFile(id: $id) {\n                mergeResult {\n                  __typename\n                  ... on ConfigFileMergeFailure {\n                    errors {\n                      message\n                    }\n                  }\n                }\n              }\n            }\n          ": types.NodePollConfigFileDocument,
    "\n        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {\n          compileGlobalSimulation(input: $input) {\n            __typename\n            ... on GlobalSimulation {\n              id\n            }\n          }\n        }\n      ": types.NodeCompileGlobalSimulationDocument,
    "\n            query nodePollSimulation($id: String!) {\n              simulation(id: $id) {\n                compileResult {\n                  __typename\n                  ... on SimulationCompileFailure {\n                    errors {\n                      message\n                    }\n                  }\n                }\n              }\n            }\n          ": types.NodePollSimulationDocument,
    "\n          mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {\n            runSimulationToFile(input: $input) {\n              __typename\n              ... on FileSink {\n                id\n              }\n              ... on RunSimulationToFileValidationError {\n                simulationId {\n                  message\n                }\n              }\n              ... on InsufficientPreviewVolumeError {\n                message\n                availableMbs\n                requiredMbs\n              }\n              ... on Error {\n                message\n              }\n            }\n          }\n        ": types.NodeRunSimulationToFileDocument,
    "\n            query nodePollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                  ... on FileSink {\n                    id\n                    importScriptUrl\n                    archives {\n                      url\n                    }\n                  }\n                }\n              }\n            }\n          ": types.NodePollSimulationSinksDocument,
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
export function gql(source: "\n          mutation nodeInitiateDeviceAuth($input: InitiateDeviceAuth!) {\n            initiateDeviceAuth(input: $input) {\n              deviceCode\n              userCode\n              verificationUrl\n            }\n          }\n        "): (typeof documents)["\n          mutation nodeInitiateDeviceAuth($input: InitiateDeviceAuth!) {\n            initiateDeviceAuth(input: $input) {\n              deviceCode\n              userCode\n              verificationUrl\n            }\n          }\n        "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n              query getVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            "): (typeof documents)["\n              query getVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation nodePushConfigFile($input: PushConfigFile!) {\n          pushConfigFile(input: $input) {\n            __typename\n            ... on ConfigFile {\n              id\n              branch {\n                name\n              }\n            }\n            ... on PushConfigFileFailure {\n              config {\n                path\n                message\n              }\n            }\n            ... on SynchronizationError {\n              message\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation nodePushConfigFile($input: PushConfigFile!) {\n          pushConfigFile(input: $input) {\n            __typename\n            ... on ConfigFile {\n              id\n              branch {\n                name\n              }\n            }\n            ... on PushConfigFileFailure {\n              config {\n                path\n                message\n              }\n            }\n            ... on SynchronizationError {\n              message\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query nodePollConfigFile($id: String!) {\n              configFile(id: $id) {\n                mergeResult {\n                  __typename\n                  ... on ConfigFileMergeFailure {\n                    errors {\n                      message\n                    }\n                  }\n                }\n              }\n            }\n          "): (typeof documents)["\n            query nodePollConfigFile($id: String!) {\n              configFile(id: $id) {\n                mergeResult {\n                  __typename\n                  ... on ConfigFileMergeFailure {\n                    errors {\n                      message\n                    }\n                  }\n                }\n              }\n            }\n          "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {\n          compileGlobalSimulation(input: $input) {\n            __typename\n            ... on GlobalSimulation {\n              id\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {\n          compileGlobalSimulation(input: $input) {\n            __typename\n            ... on GlobalSimulation {\n              id\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query nodePollSimulation($id: String!) {\n              simulation(id: $id) {\n                compileResult {\n                  __typename\n                  ... on SimulationCompileFailure {\n                    errors {\n                      message\n                    }\n                  }\n                }\n              }\n            }\n          "): (typeof documents)["\n            query nodePollSimulation($id: String!) {\n              simulation(id: $id) {\n                compileResult {\n                  __typename\n                  ... on SimulationCompileFailure {\n                    errors {\n                      message\n                    }\n                  }\n                }\n              }\n            }\n          "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n          mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {\n            runSimulationToFile(input: $input) {\n              __typename\n              ... on FileSink {\n                id\n              }\n              ... on RunSimulationToFileValidationError {\n                simulationId {\n                  message\n                }\n              }\n              ... on InsufficientPreviewVolumeError {\n                message\n                availableMbs\n                requiredMbs\n              }\n              ... on Error {\n                message\n              }\n            }\n          }\n        "): (typeof documents)["\n          mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {\n            runSimulationToFile(input: $input) {\n              __typename\n              ... on FileSink {\n                id\n              }\n              ... on RunSimulationToFileValidationError {\n                simulationId {\n                  message\n                }\n              }\n              ... on InsufficientPreviewVolumeError {\n                message\n                availableMbs\n                requiredMbs\n              }\n              ... on Error {\n                message\n              }\n            }\n          }\n        "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query nodePollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                  ... on FileSink {\n                    id\n                    importScriptUrl\n                    archives {\n                      url\n                    }\n                  }\n                }\n              }\n            }\n          "): (typeof documents)["\n            query nodePollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                  ... on FileSink {\n                    id\n                    importScriptUrl\n                    archives {\n                      url\n                    }\n                  }\n                }\n              }\n            }\n          "];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;