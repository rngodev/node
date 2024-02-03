/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: any;
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: any;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** A time string at UTC, such as 10:15:30Z, compliant with the `full-time` format outlined in section 5.6 of the RFC 3339profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Time: any;
};

export type Archive = {
  __typename?: 'Archive';
  url: Scalars['String'];
};

export type Branch = {
  __typename?: 'Branch';
  createdAt: Scalars['DateTime'];
  createdBy?: Maybe<User>;
  draft: Scalars['Boolean'];
  id: Scalars['ID'];
  name: Scalars['String'];
  organization: Organization;
  simulations: SimulationConnection;
  streams: StreamConnection;
};


export type BranchSimulationsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type BranchStreamsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type BranchConnection = {
  __typename?: 'BranchConnection';
  nodes: Array<Branch>;
  pageInfo: PageInfo;
};

export type CapacityError = Error & {
  __typename?: 'CapacityError';
  message: Scalars['String'];
};

export type CliAuth = {
  __typename?: 'CliAuth';
  cliCode: Scalars['String'];
  expiresAt: Scalars['DateTime'];
  userCode: Scalars['String'];
  verificationUrl: Scalars['String'];
};

export type CliAuthVerification = {
  __typename?: 'CliAuthVerification';
  id: Scalars['ID'];
};

export type ConfigFile = {
  __typename?: 'ConfigFile';
  branch: Branch;
  config: Scalars['JSONObject'];
  createdAt: Scalars['DateTime'];
  createdBy: User;
  id: Scalars['ID'];
  namespace: Namespace;
  organization: Organization;
  processingCompletedAt?: Maybe<Scalars['DateTime']>;
  scenarios: ScenarioConnection;
  scm?: Maybe<ConfigFileScm>;
  streams: StreamConnection;
  systems: SystemConnection;
};


export type ConfigFileScenariosArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type ConfigFileStreamsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type ConfigFileSystemsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type ConfigFileScm = {
  __typename?: 'ConfigFileScm';
  branch: Scalars['String'];
  commit?: Maybe<Scalars['String']>;
  filepath: Scalars['String'];
  parentCommit: Scalars['String'];
  repo: Scalars['String'];
};

export type CreateSimulation = {
  branchId: Scalars['ID'];
  end?: InputMaybe<Scalars['DateTime']>;
  seed?: InputMaybe<Scalars['Int']>;
  start?: InputMaybe<Scalars['DateTime']>;
  streamNames?: InputMaybe<Array<Scalars['String']>>;
};

export type CreateSimulationFailure = {
  __typename?: 'CreateSimulationFailure';
  branchId?: Maybe<Array<Error>>;
  end?: Maybe<Array<Error>>;
  start?: Maybe<Array<Error>>;
  streamNames?: Maybe<Array<Maybe<Array<Error>>>>;
};

export type CreateSimulationResult = CreateSimulationFailure | Simulation;

export type DrainSimulationToFile = {
  simulationId: Scalars['ID'];
};

export type DrainSimulationToFileResult = CapacityError | DrainSimulationToFileValidationError | FileSink | PaymentError;

export type DrainSimulationToFileValidationError = {
  __typename?: 'DrainSimulationToFileValidationError';
  simulationId?: Maybe<Array<Error>>;
};

export type Error = {
  message: Scalars['String'];
};

export type FileSink = Sink & {
  __typename?: 'FileSink';
  archives: Array<Archive>;
  completedAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  importScriptUrl?: Maybe<Scalars['String']>;
};

export type JsonError = {
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  authCli: CliAuth;
  createSimulation: CreateSimulationResult;
  drainSimulationToFile: DrainSimulationToFileResult;
  upsertConfigFile: UpsertConfigFileResult;
  verifyCliAuth: VerifyCliAuthResult;
};


export type MutationCreateSimulationArgs = {
  input: CreateSimulation;
};


export type MutationDrainSimulationToFileArgs = {
  input: DrainSimulationToFile;
};


export type MutationUpsertConfigFileArgs = {
  input?: InputMaybe<UpsertConfigFile>;
};


export type MutationVerifyCliAuthArgs = {
  input: VerifyCliAuth;
};

export type Namespace = {
  __typename?: 'Namespace';
  createdAt: Scalars['DateTime'];
  createdBy?: Maybe<User>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization: Organization;
  streams: StreamConnection;
};


export type NamespaceStreamsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type NamespaceConnection = {
  __typename?: 'NamespaceConnection';
  nodes: Array<Namespace>;
  pageInfo: PageInfo;
};

export type Organization = {
  __typename?: 'Organization';
  branches: BranchConnection;
  createdAt: Scalars['DateTime'];
  creditBalance: Scalars['Int'];
  id: Scalars['ID'];
  name: Scalars['String'];
  namespaces: NamespaceConnection;
};


export type OrganizationBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type OrganizationNamespacesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

export enum OutputFormat {
  Csv = 'CSV',
  Json = 'JSON'
}

export enum OutputMode {
  Event = 'EVENT',
  Value = 'VALUE'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
};

export type PaymentError = Error & {
  __typename?: 'PaymentError';
  message: Scalars['String'];
};

/** About the Redwood queries. */
export type Query = {
  __typename?: 'Query';
  configFile?: Maybe<ConfigFile>;
  organizations: Array<Organization>;
  /** Fetches the Redwood root schema. */
  redwood?: Maybe<Redwood>;
  simulation?: Maybe<Simulation>;
  verifiedCliAuth?: Maybe<VerifiedCliAuth>;
};


/** About the Redwood queries. */
export type QueryConfigFileArgs = {
  id: Scalars['String'];
};


/** About the Redwood queries. */
export type QueryOrganizationsArgs = {
  id?: InputMaybe<Scalars['String']>;
};


/** About the Redwood queries. */
export type QuerySimulationArgs = {
  id: Scalars['String'];
};


/** About the Redwood queries. */
export type QueryVerifiedCliAuthArgs = {
  cliCode: Scalars['String'];
};

/**
 * The RedwoodJS Root Schema
 *
 * Defines details about RedwoodJS such as the current user and version information.
 */
export type Redwood = {
  __typename?: 'Redwood';
  /** The current user. */
  currentUser?: Maybe<Scalars['JSON']>;
  /** The version of Prisma. */
  prismaVersion?: Maybe<Scalars['String']>;
  /** The version of Redwood. */
  version?: Maybe<Scalars['String']>;
};

export type Scenario = {
  __typename?: 'Scenario';
  branch: Branch;
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  end?: Maybe<Scalars['String']>;
  eventDelta?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  namespace: Namespace;
  seed?: Maybe<Scalars['Int']>;
  start?: Maybe<Scalars['String']>;
};

export type ScenarioConnection = {
  __typename?: 'ScenarioConnection';
  nodes: Array<Scenario>;
  pageInfo: PageInfo;
};

export type Simulation = {
  __typename?: 'Simulation';
  branch: Branch;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  dryRun?: Maybe<SimulationDryRun>;
  end?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  scenario?: Maybe<Scenario>;
  seed?: Maybe<Scalars['Int']>;
  sinks: Array<Sink>;
  start?: Maybe<Scalars['DateTime']>;
};

export type SimulationConnection = {
  __typename?: 'SimulationConnection';
  nodes: Array<Simulation>;
  pageInfo: PageInfo;
};

export type SimulationDryRun = {
  __typename?: 'SimulationDryRun';
  dataUnits: Scalars['Int'];
};

export type Sink = {
  completedAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
};

export type Stream = {
  __typename?: 'Stream';
  branch: Branch;
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  id: Scalars['ID'];
  name: Scalars['String'];
  namespace: Namespace;
  outputs: Array<StreamOutput>;
  references: Array<Stream>;
  schema: Scalars['JSONObject'];
  streamSystems: Array<StreamSystem>;
};

export type StreamConnection = {
  __typename?: 'StreamConnection';
  nodes: Array<Stream>;
  pageInfo: PageInfo;
};

export type StreamOutput = {
  __typename?: 'StreamOutput';
  format: OutputFormat;
  mode: OutputMode;
};

export type StreamSystem = {
  __typename?: 'StreamSystem';
  parameters: Array<StreamSystemParameter>;
  system: System;
};

export type StreamSystemParameter = {
  __typename?: 'StreamSystemParameter';
  key: Scalars['String'];
  value: Scalars['String'];
};

export type System = {
  __typename?: 'System';
  branch: Branch;
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  id: Scalars['ID'];
  name: Scalars['String'];
  namespace: Namespace;
  parameters: Array<SystemParameter>;
};

export type SystemConnection = {
  __typename?: 'SystemConnection';
  nodes: Array<System>;
  pageInfo: PageInfo;
};

export type SystemParameter = {
  __typename?: 'SystemParameter';
  default?: Maybe<Scalars['String']>;
  env?: Maybe<Scalars['String']>;
  key: Scalars['String'];
};

export type UpsertConfigFile = {
  config: Scalars['JSONObject'];
  scm?: InputMaybe<UpsertConfigFileScm>;
};

export type UpsertConfigFileFailure = {
  __typename?: 'UpsertConfigFileFailure';
  config?: Maybe<Array<JsonError>>;
};

export type UpsertConfigFileResult = ConfigFile | UpsertConfigFileFailure;

export type UpsertConfigFileScm = {
  branch: Scalars['String'];
  commit?: InputMaybe<Scalars['String']>;
  filepath: Scalars['String'];
  parentCommit: Scalars['String'];
  repo: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type VerifiedCliAuth = {
  __typename?: 'VerifiedCliAuth';
  token: Scalars['String'];
};

export type VerifyCliAuth = {
  cliAuthId: Scalars['String'];
  userCode: Scalars['String'];
};

export type VerifyCliAuthFailure = {
  __typename?: 'VerifyCliAuthFailure';
  cliAuthId?: Maybe<Array<Error>>;
  userCode?: Maybe<Array<Error>>;
};

export type VerifyCliAuthResult = CliAuthVerification | VerifyCliAuthFailure;

export type AuthCliMutationVariables = Exact<{ [key: string]: never; }>;


export type AuthCliMutation = { __typename?: 'Mutation', authCli: { __typename?: 'CliAuth', cliCode: string, userCode: string, verificationUrl: string } };

export type GetVerifiedCliAuthQueryVariables = Exact<{
  cliCode: Scalars['String'];
}>;


export type GetVerifiedCliAuthQuery = { __typename?: 'Query', verifiedCliAuth?: { __typename?: 'VerifiedCliAuth', token: string } | null };

export type UpsertConfigFileMutationVariables = Exact<{
  input: UpsertConfigFile;
}>;


export type UpsertConfigFileMutation = { __typename?: 'Mutation', upsertConfigFile: { __typename: 'ConfigFile', id: string, branch: { __typename?: 'Branch', id: string } } | { __typename: 'UpsertConfigFileFailure', config?: Array<never> | null } };

export type CreateSimulationMutationVariables = Exact<{
  input: CreateSimulation;
}>;


export type CreateSimulationMutation = { __typename?: 'Mutation', createSimulation: { __typename: 'CreateSimulationFailure', branchId?: Array<{ __typename?: 'CapacityError', message: string } | { __typename?: 'PaymentError', message: string }> | null } | { __typename: 'Simulation', id: string, sinks: Array<{ __typename?: 'FileSink', id: string }> } };

export type GetSimulationQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetSimulationQuery = { __typename?: 'Query', simulation?: { __typename?: 'Simulation', id: string, sinks: Array<{ __typename?: 'FileSink', id: string, completedAt?: any | null }> } | null };

export type DrainSimulationToFileMutationVariables = Exact<{
  input: DrainSimulationToFile;
}>;


export type DrainSimulationToFileMutation = { __typename?: 'Mutation', drainSimulationToFile: { __typename: 'CapacityError', message: string } | { __typename: 'DrainSimulationToFileValidationError', simulationId?: Array<{ __typename?: 'CapacityError', message: string } | { __typename?: 'PaymentError', message: string }> | null } | { __typename: 'FileSink', id: string, importScriptUrl?: string | null, archives: Array<{ __typename?: 'Archive', url: string }> } | { __typename: 'PaymentError', message: string } };


export const AuthCliDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthCli"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authCli"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cliCode"}},{"kind":"Field","name":{"kind":"Name","value":"userCode"}},{"kind":"Field","name":{"kind":"Name","value":"verificationUrl"}}]}}]}}]} as unknown as DocumentNode<AuthCliMutation, AuthCliMutationVariables>;
export const GetVerifiedCliAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVerifiedCliAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cliCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifiedCliAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cliCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cliCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<GetVerifiedCliAuthQuery, GetVerifiedCliAuthQueryVariables>;
export const UpsertConfigFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertConfigFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertConfigFile"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertConfigFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertConfigFileFailure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpsertConfigFileMutation, UpsertConfigFileMutationVariables>;
export const CreateSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSimulation"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Simulation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSimulationFailure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"branchId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateSimulationMutation, CreateSimulationMutationVariables>;
export const GetSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetSimulationQuery, GetSimulationQueryVariables>;
export const DrainSimulationToFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"drainSimulationToFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DrainSimulationToFile"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"drainSimulationToFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileSink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"importScriptUrl"}},{"kind":"Field","name":{"kind":"Name","value":"archives"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DrainSimulationToFileValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulationId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<DrainSimulationToFileMutation, DrainSimulationToFileMutationVariables>;