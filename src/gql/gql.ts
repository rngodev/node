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
    "\n        mutation AuthCli {\n          authCli {\n            cliCode\n            userCode\n            verificationUrl\n          }\n        }\n      ": types.AuthCliDocument,
    "\n        query GetVerifiedCliAuth($cliCode: String!) {\n          verifiedCliAuth(cliCode: $cliCode) {\n            token\n          }\n        }\n      ": types.GetVerifiedCliAuthDocument,
    "\n        query getOrganizations {\n          organizations {\n            id\n            name\n            createdAt\n          }\n        }\n      ": types.GetOrganizationsDocument,
    "\n          mutation upsertConfigFile($input: UpsertConfigFile!) {\n            upsertConfigFile(input: $input) {\n              id\n              branch {\n                id\n              }\n            }\n          }\n        ": types.UpsertConfigFileDocument,
    "\n        mutation createSimulation($input: CreateSimulation!) {\n          createSimulation(input: $input) {\n            id\n          }\n        }\n      ": types.CreateSimulationDocument,
    "\n        query getSimulation($id: String!) {\n          simulation(id: $id) {\n            id\n            streams {\n              metadataUrl\n              streamVersion {\n                stream {\n                  name\n                }\n              }\n              outputs {\n                dataUrl\n              }\n              systems {\n                systemVersion {\n                  system {\n                    name\n                  }\n                }\n                scriptUrls\n              }\n            }\n            completedAt\n          }\n        }\n      ": types.GetSimulationDocument,
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
export function gql(source: "\n        mutation AuthCli {\n          authCli {\n            cliCode\n            userCode\n            verificationUrl\n          }\n        }\n      "): (typeof documents)["\n        mutation AuthCli {\n          authCli {\n            cliCode\n            userCode\n            verificationUrl\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        query GetVerifiedCliAuth($cliCode: String!) {\n          verifiedCliAuth(cliCode: $cliCode) {\n            token\n          }\n        }\n      "): (typeof documents)["\n        query GetVerifiedCliAuth($cliCode: String!) {\n          verifiedCliAuth(cliCode: $cliCode) {\n            token\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        query getOrganizations {\n          organizations {\n            id\n            name\n            createdAt\n          }\n        }\n      "): (typeof documents)["\n        query getOrganizations {\n          organizations {\n            id\n            name\n            createdAt\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n          mutation upsertConfigFile($input: UpsertConfigFile!) {\n            upsertConfigFile(input: $input) {\n              id\n              branch {\n                id\n              }\n            }\n          }\n        "): (typeof documents)["\n          mutation upsertConfigFile($input: UpsertConfigFile!) {\n            upsertConfigFile(input: $input) {\n              id\n              branch {\n                id\n              }\n            }\n          }\n        "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        mutation createSimulation($input: CreateSimulation!) {\n          createSimulation(input: $input) {\n            id\n          }\n        }\n      "): (typeof documents)["\n        mutation createSimulation($input: CreateSimulation!) {\n          createSimulation(input: $input) {\n            id\n          }\n        }\n      "];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n        query getSimulation($id: String!) {\n          simulation(id: $id) {\n            id\n            streams {\n              metadataUrl\n              streamVersion {\n                stream {\n                  name\n                }\n              }\n              outputs {\n                dataUrl\n              }\n              systems {\n                systemVersion {\n                  system {\n                    name\n                  }\n                }\n                scriptUrls\n              }\n            }\n            completedAt\n          }\n        }\n      "): (typeof documents)["\n        query getSimulation($id: String!) {\n          simulation(id: $id) {\n            id\n            streams {\n              metadataUrl\n              streamVersion {\n                stream {\n                  name\n                }\n              }\n              outputs {\n                dataUrl\n              }\n              systems {\n                systemVersion {\n                  system {\n                    name\n                  }\n                }\n                scriptUrls\n              }\n            }\n            completedAt\n          }\n        }\n      "];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;