/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any; }
  /** The `Byte` scalar type represents byte value as a Buffer */
  Byte: { input: any; output: any; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
  File: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any; }
  /** A time string at UTC, such as 10:15:30Z, compliant with the `full-time` format outlined in section 5.6 of the RFC 3339profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Time: { input: any; output: any; }
};

export type Archive = {
  __typename?: 'Archive';
  url: Scalars['String']['output'];
};

export type Branch = {
  __typename?: 'Branch';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  name: Scalars['String']['output'];
  organization: Organization;
  scenarios: ScenarioConnection;
  simulations: SimulationConnection;
  streams: StreamConnection;
  systems: SystemConnection;
};


export type BranchScenariosArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type BranchSimulationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type BranchStreamsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  names?: InputMaybe<Array<Scalars['String']['input']>>;
  namespaces?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type BranchSystemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type BranchConnection = {
  __typename?: 'BranchConnection';
  nodes: Array<Branch>;
  pageInfo: PageInfo;
};

export type CapacityError = Error & {
  __typename?: 'CapacityError';
  message: Scalars['String']['output'];
};

export type CompileGlobalSimulation = {
  branch?: InputMaybe<Scalars['String']['input']>;
  end?: InputMaybe<Scalars['String']['input']>;
  organization?: InputMaybe<Scalars['String']['input']>;
  scenario?: InputMaybe<Scalars['String']['input']>;
  seed?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['String']['input']>;
  streams?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CompileGlobalSimulationResult = CompileGlobalSimulationValidationError | Simulation;

export type CompileGlobalSimulationValidationError = {
  __typename?: 'CompileGlobalSimulationValidationError';
  branch?: Maybe<Array<Error>>;
  organization?: Maybe<Array<Error>>;
};

export type CompileLocalSimulation = {
  branch?: InputMaybe<Scalars['String']['input']>;
  configFileSource: Scalars['JSONObject']['input'];
  end?: InputMaybe<Scalars['String']['input']>;
  scenario?: InputMaybe<Scalars['String']['input']>;
  seed?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['String']['input']>;
};

export type CompileLocalSimulationResult = Simulation | SimulationCompileFailure;

export type CompiledSimulation = {
  __typename?: 'CompiledSimulation';
  end: Scalars['DateTime']['output'];
  scenario?: Maybe<Scenario>;
  seed: Scalars['Int']['output'];
  start: Scalars['DateTime']['output'];
  streams: StreamConnection;
  systems: SystemConnection;
  volume: Scalars['Int']['output'];
};


export type CompiledSimulationStreamsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type CompiledSimulationSystemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ConfigFile = {
  __typename?: 'ConfigFile';
  branch?: Maybe<Branch>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  mergeResult?: Maybe<ConfigFileMergeResult>;
  namespace?: Maybe<Scalars['String']['output']>;
  source: Scalars['JSONObject']['output'];
};

export type ConfigFileMergeFailure = {
  __typename?: 'ConfigFileMergeFailure';
  createdAt: Scalars['DateTime']['output'];
  errors: Array<Error>;
};

export type ConfigFileMergeResult = ConfigFileMergeFailure | MergedConfigFile;

export type DeviceAuth = {
  __typename?: 'DeviceAuth';
  deviceCode: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
  userCode: Scalars['String']['output'];
  verificationUrl: Scalars['String']['output'];
};

export type DeviceAuthVerification = {
  __typename?: 'DeviceAuthVerification';
  id: Scalars['ID']['output'];
};

export enum DeviceType {
  Cli = 'CLI'
}

export type Error = {
  message: Scalars['String']['output'];
};

export type FileSink = Sink & {
  __typename?: 'FileSink';
  archives: Array<Archive>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  importScriptUrl?: Maybe<Scalars['String']['output']>;
  metadataUrl?: Maybe<Scalars['String']['output']>;
};

export type InitiateDeviceAuth = {
  deviceType?: InputMaybe<DeviceType>;
};

export type InsufficientPreviewVolumeError = Error & {
  __typename?: 'InsufficientPreviewVolumeError';
  availableMbs: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  requiredMbs: Scalars['Int']['output'];
};

export type Issue = {
  message: Scalars['String']['output'];
};

export type JsonObjectIssue = Issue & {
  __typename?: 'JSONObjectIssue';
  jsonPointer: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type JsonError = {
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type MergedConfigFile = {
  __typename?: 'MergedConfigFile';
  createdAt: Scalars['DateTime']['output'];
  streamReferences?: Maybe<Array<StreamReference>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  compileGlobalSimulation: CompileGlobalSimulationResult;
  compileLocalSimulation: CompileLocalSimulationResult;
  initiateDeviceAuth: DeviceAuth;
  pushConfigFile: PushConfigFileResult;
  runSimulationToFile: RunSimulationToFileResult;
  verifyDeviceAuth: VerifyDeviceAuthResult;
};


export type MutationCompileGlobalSimulationArgs = {
  input: CompileGlobalSimulation;
};


export type MutationCompileLocalSimulationArgs = {
  input: CompileLocalSimulation;
};


export type MutationInitiateDeviceAuthArgs = {
  input: InitiateDeviceAuth;
};


export type MutationPushConfigFileArgs = {
  input: PushConfigFile;
};


export type MutationRunSimulationToFileArgs = {
  input: RunSimulationToFile;
};


export type MutationVerifyDeviceAuthArgs = {
  input: VerifyDeviceAuth;
};

export type Organization = {
  __typename?: 'Organization';
  branches: BranchConnection;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  plan: OrganizationPlan;
  previewSimulationVolumeRemaining?: Maybe<Scalars['Int']['output']>;
  simulations: SimulationConnection;
  streams: StreamConnection;
  stripeCheckoutSessionUrl?: Maybe<Scalars['String']['output']>;
};


export type OrganizationBranchesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type OrganizationSimulationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type OrganizationStreamsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  names?: InputMaybe<Array<Scalars['String']['input']>>;
  namespaces?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type OrganizationStripeCheckoutSessionUrlArgs = {
  key?: InputMaybe<Scalars['String']['input']>;
};

export enum OrganizationPlan {
  Preview = 'PREVIEW',
  Solo = 'SOLO'
}

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
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PushConfigFile = {
  branch?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['JSONObject']['input'];
};

export type PushConfigFileFailure = {
  __typename?: 'PushConfigFileFailure';
  branch?: Maybe<Array<Error>>;
  config?: Maybe<Array<JsonError>>;
};

export type PushConfigFileResult = ConfigFile | PushConfigFileFailure | SynchronizationError;

/** About the Redwood queries. */
export type Query = {
  __typename?: 'Query';
  configFile?: Maybe<ConfigFile>;
  organization?: Maybe<Organization>;
  organizations: Array<Organization>;
  /** Fetches the Redwood root schema. */
  redwood?: Maybe<Redwood>;
  simulation?: Maybe<Simulation>;
  verifiedDeviceAuth?: Maybe<VerifiedDeviceAuth>;
};


/** About the Redwood queries. */
export type QueryConfigFileArgs = {
  id: Scalars['String']['input'];
};


/** About the Redwood queries. */
export type QueryOrganizationArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


/** About the Redwood queries. */
export type QueryOrganizationsArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


/** About the Redwood queries. */
export type QuerySimulationArgs = {
  id: Scalars['String']['input'];
};


/** About the Redwood queries. */
export type QueryVerifiedDeviceAuthArgs = {
  deviceCode: Scalars['String']['input'];
};

/**
 * The RedwoodJS Root Schema
 *
 * Defines details about RedwoodJS such as the current user and version information.
 */
export type Redwood = {
  __typename?: 'Redwood';
  /** The current user. */
  currentUser?: Maybe<Scalars['JSON']['output']>;
  /** The version of Prisma. */
  prismaVersion?: Maybe<Scalars['String']['output']>;
  /** The version of Redwood. */
  version?: Maybe<Scalars['String']['output']>;
};

export type RunSimulationToFile = {
  simulationId: Scalars['ID']['input'];
};

export type RunSimulationToFileResult = CapacityError | FileSink | InsufficientPreviewVolumeError | RunSimulationToFileValidationError | SynchronizationError;

export type RunSimulationToFileValidationError = {
  __typename?: 'RunSimulationToFileValidationError';
  simulationId?: Maybe<Array<Error>>;
};

export type Scenario = {
  __typename?: 'Scenario';
  branch: Branch;
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  end?: Maybe<Scalars['String']['output']>;
  eventDelta?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  seed?: Maybe<Scalars['Int']['output']>;
  start?: Maybe<Scalars['String']['output']>;
};

export type ScenarioConnection = {
  __typename?: 'ScenarioConnection';
  nodes: Array<Scenario>;
  pageInfo: PageInfo;
};

export type SimpleIssue = Issue & {
  __typename?: 'SimpleIssue';
  message: Scalars['String']['output'];
};

export type Simulation = {
  __typename?: 'Simulation';
  branch?: Maybe<Branch>;
  compileResult?: Maybe<SimulationCompileResult>;
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  end?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  scenario?: Maybe<Scalars['String']['output']>;
  seed?: Maybe<Scalars['Int']['output']>;
  sinks: Array<Sink>;
  start?: Maybe<Scalars['String']['output']>;
};

export type SimulationCompileFailure = {
  __typename?: 'SimulationCompileFailure';
  configFileSource?: Maybe<Array<JsonObjectIssue>>;
  end?: Maybe<Array<Issue>>;
  scenario?: Maybe<Array<Issue>>;
  start?: Maybe<Array<Issue>>;
};

export type SimulationCompileResult = CompiledSimulation | SimulationCompileFailure;

export type SimulationConnection = {
  __typename?: 'SimulationConnection';
  nodes: Array<Simulation>;
  pageInfo: PageInfo;
};

export type Sink = {
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
};

export type Stream = {
  __typename?: 'Stream';
  branch: Branch;
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  outputs: Array<StreamOutput>;
  references: Array<StreamReference>;
  schema: Scalars['JSONObject']['output'];
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

export type StreamReference = {
  __typename?: 'StreamReference';
  branch?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
};

export type StreamSystem = {
  __typename?: 'StreamSystem';
  branch?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  parameters: Array<StreamSystemParameter>;
};

export type StreamSystemParameter = {
  __typename?: 'StreamSystemParameter';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type SynchronizationError = Error & {
  __typename?: 'SynchronizationError';
  message: Scalars['String']['output'];
};

export type System = {
  __typename?: 'System';
  branch: Branch;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  parameters: Array<SystemParameter>;
};

export type SystemConnection = {
  __typename?: 'SystemConnection';
  nodes: Array<System>;
  pageInfo: PageInfo;
};

export type SystemParameter = {
  __typename?: 'SystemParameter';
  default?: Maybe<Scalars['String']['output']>;
  env?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type VerifiedDeviceAuth = {
  __typename?: 'VerifiedDeviceAuth';
  token: Scalars['String']['output'];
};

export type VerifyDeviceAuth = {
  deviceAuthId: Scalars['String']['input'];
  userCode: Scalars['String']['input'];
};

export type VerifyDeviceAuthFailure = {
  __typename?: 'VerifyDeviceAuthFailure';
  deviceAuthId?: Maybe<Array<Error>>;
  userCode?: Maybe<Array<Error>>;
};

export type VerifyDeviceAuthResult = DeviceAuthVerification | VerifyDeviceAuthFailure;

export type NodeInitiateDeviceAuthMutationVariables = Exact<{
  input: InitiateDeviceAuth;
}>;


export type NodeInitiateDeviceAuthMutation = { __typename?: 'Mutation', initiateDeviceAuth: { __typename?: 'DeviceAuth', deviceCode: string, userCode: string, verificationUrl: string } };

export type NodeGetVerifiedDeviceAuthQueryVariables = Exact<{
  deviceCode: Scalars['String']['input'];
}>;


export type NodeGetVerifiedDeviceAuthQuery = { __typename?: 'Query', verifiedDeviceAuth?: { __typename?: 'VerifiedDeviceAuth', token: string } | null };

export type NodeCompileLocalSimulationMutationVariables = Exact<{
  input: CompileLocalSimulation;
}>;


export type NodeCompileLocalSimulationMutation = { __typename?: 'Mutation', compileLocalSimulation: { __typename: 'Simulation', id: string } | { __typename: 'SimulationCompileFailure', configFileSource?: Array<{ __typename?: 'JSONObjectIssue', jsonPointer: string, message: string }> | null } };

export type NodePushConfigFileMutationVariables = Exact<{
  input: PushConfigFile;
}>;


export type NodePushConfigFileMutation = { __typename?: 'Mutation', pushConfigFile: { __typename: 'ConfigFile', id: string, branch?: { __typename?: 'Branch', name: string } | null } | { __typename: 'PushConfigFileFailure', config?: Array<never> | null } | { __typename: 'SynchronizationError', message: string } };

export type NodePollConfigFileQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type NodePollConfigFileQuery = { __typename?: 'Query', configFile?: { __typename?: 'ConfigFile', mergeResult?: { __typename: 'ConfigFileMergeFailure', errors: Array<{ __typename?: 'CapacityError', message: string } | { __typename?: 'InsufficientPreviewVolumeError', message: string } | { __typename?: 'SynchronizationError', message: string }> } | { __typename: 'MergedConfigFile' } | null } | null };

export type NodeCompileGlobalSimulationMutationVariables = Exact<{
  input: CompileGlobalSimulation;
}>;


export type NodeCompileGlobalSimulationMutation = { __typename?: 'Mutation', compileGlobalSimulation: { __typename: 'CompileGlobalSimulationValidationError' } | { __typename: 'Simulation', id: string } };

export type NodePollSimulationQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type NodePollSimulationQuery = { __typename?: 'Query', simulation?: { __typename?: 'Simulation', compileResult?: { __typename: 'CompiledSimulation' } | { __typename: 'SimulationCompileFailure', scenario?: Array<{ __typename?: 'JSONObjectIssue', message: string } | { __typename?: 'SimpleIssue', message: string }> | null } | null } | null };

export type NodeRunSimulationToFileMutationVariables = Exact<{
  input: RunSimulationToFile;
}>;


export type NodeRunSimulationToFileMutation = { __typename?: 'Mutation', runSimulationToFile: { __typename: 'CapacityError', message: string } | { __typename: 'FileSink', id: string } | { __typename: 'InsufficientPreviewVolumeError', message: string, availableMbs: number, requiredMbs: number } | { __typename: 'RunSimulationToFileValidationError', simulationId?: Array<{ __typename?: 'CapacityError', message: string } | { __typename?: 'InsufficientPreviewVolumeError', message: string } | { __typename?: 'SynchronizationError', message: string }> | null } | { __typename: 'SynchronizationError', message: string } };

export type NodePollSimulationSinksQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type NodePollSimulationSinksQuery = { __typename?: 'Query', simulation?: { __typename?: 'Simulation', id: string, sinks: Array<{ __typename?: 'FileSink', id: string, importScriptUrl?: string | null, completedAt?: any | null, archives: Array<{ __typename?: 'Archive', url: string }> }> } | null };


export const NodeInitiateDeviceAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"nodeInitiateDeviceAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InitiateDeviceAuth"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initiateDeviceAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceCode"}},{"kind":"Field","name":{"kind":"Name","value":"userCode"}},{"kind":"Field","name":{"kind":"Name","value":"verificationUrl"}}]}}]}}]} as unknown as DocumentNode<NodeInitiateDeviceAuthMutation, NodeInitiateDeviceAuthMutationVariables>;
export const NodeGetVerifiedDeviceAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"nodeGetVerifiedDeviceAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifiedDeviceAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<NodeGetVerifiedDeviceAuthQuery, NodeGetVerifiedDeviceAuthQueryVariables>;
export const NodeCompileLocalSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"nodeCompileLocalSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CompileLocalSimulation"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"compileLocalSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Simulation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SimulationCompileFailure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"configFileSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jsonPointer"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<NodeCompileLocalSimulationMutation, NodeCompileLocalSimulationMutationVariables>;
export const NodePushConfigFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"nodePushConfigFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PushConfigFile"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pushConfigFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PushConfigFileFailure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SynchronizationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<NodePushConfigFileMutation, NodePushConfigFileMutationVariables>;
export const NodePollConfigFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"nodePollConfigFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"configFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mergeResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigFileMergeFailure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<NodePollConfigFileQuery, NodePollConfigFileQueryVariables>;
export const NodeCompileGlobalSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"nodeCompileGlobalSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CompileGlobalSimulation"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"compileGlobalSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Simulation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<NodeCompileGlobalSimulationMutation, NodeCompileGlobalSimulationMutationVariables>;
export const NodePollSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"nodePollSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"compileResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SimulationCompileFailure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scenario"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<NodePollSimulationQuery, NodePollSimulationQueryVariables>;
export const NodeRunSimulationToFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"nodeRunSimulationToFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RunSimulationToFile"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runSimulationToFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileSink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RunSimulationToFileValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulationId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InsufficientPreviewVolumeError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"availableMbs"}},{"kind":"Field","name":{"kind":"Name","value":"requiredMbs"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<NodeRunSimulationToFileMutation, NodeRunSimulationToFileMutationVariables>;
export const NodePollSimulationSinksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"nodePollSimulationSinks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileSink"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"importScriptUrl"}},{"kind":"Field","name":{"kind":"Name","value":"archives"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<NodePollSimulationSinksQuery, NodePollSimulationSinksQueryVariables>;