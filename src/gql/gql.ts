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
    "\n              query nodeGetVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            ": types.NodeGetVerifiedDeviceAuthDocument,
    "\n        mutation nodeCompileLocalSimulation($input: CompileLocalSimulation!) {\n          compileLocalSimulation(input: $input) {\n            id\n            result {\n              __typename\n              ... on CompileSimulationFailure {\n                configFileSource {\n                  jsonPointer\n                  issue {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        }\n      ": types.NodeCompileLocalSimulationDocument,
    "\n        mutation nodePublishConfigFile($input: PublishConfigFile!) {\n          publishConfigFile(input: $input) {\n            id\n            result {\n              __typename\n              ... on PublishConfigFileSuccess {\n                configFile {\n                  key\n                  branch {\n                    name\n                  }\n                }\n              }\n              ... on PublishConfigFileFailure {\n                source {\n                  jsonPointer\n                  issue {\n                    message\n                  }\n                }\n              }\n              ... on ConcurrencyIssue {\n                message\n              }\n            }\n          }\n        }\n      ": types.NodePublishConfigFileDocument,
    "\n            query nodePollConfigFilePublication($id: ID!) {\n              configFilePublication(id: $id) {\n                result {\n                  __typename\n                  ... on PublishConfigFileSuccess {\n                    configFile {\n                      key\n                      branch {\n                        name\n                      }\n                    }\n                  }\n                  ... on PublishConfigFileFailure {\n                    source {\n                      jsonPointer\n                      issue {\n                        message\n                      }\n                    }\n                  }\n                  ... on ConcurrencyIssue {\n                    message\n                  }\n                }\n              }\n            }\n          ": types.NodePollConfigFilePublicationDocument,
    "\n        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {\n          compileGlobalSimulation(input: $input) {\n            id\n            result {\n              __typename\n            }\n          }\n        }\n      ": types.NodeCompileGlobalSimulationDocument,
    "\n          query nodePollSimulationCompilation($id: ID!) {\n            simulationCompilation(id: $id) {\n              result {\n                __typename\n                ... on CompileSimulationFailure {\n                  scenario {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        ": types.NodePollSimulationCompilationDocument,
    "\n        mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {\n          runSimulationToFile(input: $input) {\n            __typename\n            ... on FileSink {\n              id\n            }\n            ... on RunSimulationToFileFailure {\n              simulationId {\n                message\n              }\n            }\n            ... on PreviewVolumeIssue {\n              message\n              availableUnits\n              requiredUnits\n            }\n            ... on Issue {\n              message\n            }\n          }\n        }\n      ": types.NodeRunSimulationToFileDocument,
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
export function gql(source: "\n              query nodeGetVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            "): (typeof documents)["\n              query nodeGetVerifiedDeviceAuth($deviceCode: String!) {\n                verifiedDeviceAuth(deviceCode: $deviceCode) {\n                  token\n                }\n              }\n            "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation nodeCompileLocalSimulation($input: CompileLocalSimulation!) {\n          compileLocalSimulation(input: $input) {\n            id\n            result {\n              __typename\n              ... on CompileSimulationFailure {\n                configFileSource {\n                  jsonPointer\n                  issue {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation nodeCompileLocalSimulation($input: CompileLocalSimulation!) {\n          compileLocalSimulation(input: $input) {\n            id\n            result {\n              __typename\n              ... on CompileSimulationFailure {\n                configFileSource {\n                  jsonPointer\n                  issue {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation nodePublishConfigFile($input: PublishConfigFile!) {\n          publishConfigFile(input: $input) {\n            id\n            result {\n              __typename\n              ... on PublishConfigFileSuccess {\n                configFile {\n                  key\n                  branch {\n                    name\n                  }\n                }\n              }\n              ... on PublishConfigFileFailure {\n                source {\n                  jsonPointer\n                  issue {\n                    message\n                  }\n                }\n              }\n              ... on ConcurrencyIssue {\n                message\n              }\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation nodePublishConfigFile($input: PublishConfigFile!) {\n          publishConfigFile(input: $input) {\n            id\n            result {\n              __typename\n              ... on PublishConfigFileSuccess {\n                configFile {\n                  key\n                  branch {\n                    name\n                  }\n                }\n              }\n              ... on PublishConfigFileFailure {\n                source {\n                  jsonPointer\n                  issue {\n                    message\n                  }\n                }\n              }\n              ... on ConcurrencyIssue {\n                message\n              }\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query nodePollConfigFilePublication($id: ID!) {\n              configFilePublication(id: $id) {\n                result {\n                  __typename\n                  ... on PublishConfigFileSuccess {\n                    configFile {\n                      key\n                      branch {\n                        name\n                      }\n                    }\n                  }\n                  ... on PublishConfigFileFailure {\n                    source {\n                      jsonPointer\n                      issue {\n                        message\n                      }\n                    }\n                  }\n                  ... on ConcurrencyIssue {\n                    message\n                  }\n                }\n              }\n            }\n          "): (typeof documents)["\n            query nodePollConfigFilePublication($id: ID!) {\n              configFilePublication(id: $id) {\n                result {\n                  __typename\n                  ... on PublishConfigFileSuccess {\n                    configFile {\n                      key\n                      branch {\n                        name\n                      }\n                    }\n                  }\n                  ... on PublishConfigFileFailure {\n                    source {\n                      jsonPointer\n                      issue {\n                        message\n                      }\n                    }\n                  }\n                  ... on ConcurrencyIssue {\n                    message\n                  }\n                }\n              }\n            }\n          "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {\n          compileGlobalSimulation(input: $input) {\n            id\n            result {\n              __typename\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation nodeCompileGlobalSimulation($input: CompileGlobalSimulation!) {\n          compileGlobalSimulation(input: $input) {\n            id\n            result {\n              __typename\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n          query nodePollSimulationCompilation($id: ID!) {\n            simulationCompilation(id: $id) {\n              result {\n                __typename\n                ... on CompileSimulationFailure {\n                  scenario {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        "): (typeof documents)["\n          query nodePollSimulationCompilation($id: ID!) {\n            simulationCompilation(id: $id) {\n              result {\n                __typename\n                ... on CompileSimulationFailure {\n                  scenario {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {\n          runSimulationToFile(input: $input) {\n            __typename\n            ... on FileSink {\n              id\n            }\n            ... on RunSimulationToFileFailure {\n              simulationId {\n                message\n              }\n            }\n            ... on PreviewVolumeIssue {\n              message\n              availableUnits\n              requiredUnits\n            }\n            ... on Issue {\n              message\n            }\n          }\n        }\n      "): (typeof documents)["\n        mutation nodeRunSimulationToFile($input: RunSimulationToFile!) {\n          runSimulationToFile(input: $input) {\n            __typename\n            ... on FileSink {\n              id\n            }\n            ... on RunSimulationToFileFailure {\n              simulationId {\n                message\n              }\n            }\n            ... on PreviewVolumeIssue {\n              message\n              availableUnits\n              requiredUnits\n            }\n            ... on Issue {\n              message\n            }\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n            query nodePollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                  ... on FileSink {\n                    id\n                    importScriptUrl\n                    archives {\n                      url\n                    }\n                  }\n                }\n              }\n            }\n          "): (typeof documents)["\n            query nodePollSimulationSinks($id: String!) {\n              simulation(id: $id) {\n                id\n                sinks {\n                  id\n                  completedAt\n                  ... on FileSink {\n                    id\n                    importScriptUrl\n                    archives {\n                      url\n                    }\n                  }\n                }\n              }\n            }\n          "];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;