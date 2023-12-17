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

export type Branch = {
  __typename?: 'Branch';
  createdAt: Scalars['DateTime'];
  createdBy?: Maybe<User>;
  draft: Scalars['Boolean'];
  id: Scalars['ID'];
  name: Scalars['String'];
  organization: Organization;
  simulations?: Maybe<Array<Maybe<Simulation>>>;
  streams: Array<Stream>;
};

export type CliAuth = {
  __typename?: 'CliAuth';
  cliCode: Scalars['String'];
  expiresAt: Scalars['DateTime'];
  userCode: Scalars['String'];
  verificationUrl: Scalars['String'];
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
  scenarioVersions: Array<ScenarioVersion>;
  scm?: Maybe<ConfigFileScm>;
  streamVersions: Array<StreamVersion>;
  systemVersions: Array<SystemVersion>;
};

export type ConfigFileScm = {
  __typename?: 'ConfigFileScm';
  branch: Scalars['String'];
  commit?: Maybe<Scalars['String']>;
  filepath: Scalars['String'];
  parentCommit: Scalars['String'];
  repo: Scalars['String'];
};

export type ConfigFileValidation = {
  __typename?: 'ConfigFileValidation';
  issues: Array<Error>;
};

export type CreateOrganization = {
  adminEmails: Array<InputMaybe<Scalars['String']>>;
  memberEmails: Array<InputMaybe<Scalars['String']>>;
  name: Scalars['String'];
};

export type CreateSimulation = {
  branchId: Scalars['ID'];
  end?: InputMaybe<Scalars['DateTime']>;
  seed?: InputMaybe<Scalars['Int']>;
  start?: InputMaybe<Scalars['DateTime']>;
  streamNames?: InputMaybe<Array<Scalars['String']>>;
};

export type Error = {
  message: Scalars['String'];
  path?: Maybe<Array<Scalars['String']>>;
};

export type InvalidError = Error & {
  __typename?: 'InvalidError';
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type InviteOrganizationUsers = {
  adminEmails: Array<InputMaybe<Scalars['String']>>;
  memberEmails: Array<InputMaybe<Scalars['String']>>;
  organizationId: Scalars['ID'];
};

export type Mutation = {
  __typename?: 'Mutation';
  authCli: CliAuth;
  createOrganization: Organization;
  createSimulation: Simulation;
  inviteOrganizationUsers: Organization;
  upsertBranch: Branch;
  upsertConfigFile: ConfigFile;
  upsertNamespace: Namespace;
  validateConfigFile: ConfigFileValidation;
  verifyCliAuth: Scalars['String'];
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganization;
};


export type MutationCreateSimulationArgs = {
  input: CreateSimulation;
};


export type MutationInviteOrganizationUsersArgs = {
  input: InviteOrganizationUsers;
};


export type MutationUpsertBranchArgs = {
  input: UpsertBranch;
};


export type MutationUpsertConfigFileArgs = {
  input?: InputMaybe<UpsertConfigFile>;
};


export type MutationUpsertNamespaceArgs = {
  input: UpsertNamespace;
};


export type MutationValidateConfigFileArgs = {
  input: ValidateConfigFile;
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
  streams?: Maybe<Array<Maybe<Stream>>>;
};

export type Organization = {
  __typename?: 'Organization';
  branches?: Maybe<Array<Branch>>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  memberships: Array<OrganizationMembership>;
  name: Scalars['String'];
  namespaces?: Maybe<Array<Namespace>>;
};

export type OrganizationMembership = {
  __typename?: 'OrganizationMembership';
  createdAt: Scalars['DateTime'];
  role: OrganizationRole;
  user: User;
};

export enum OrganizationRole {
  Admin = 'ADMIN',
  Member = 'MEMBER'
}

export enum OutputFormat {
  Csv = 'CSV',
  Json = 'JSON'
}

export enum OutputMode {
  Event = 'EVENT',
  Value = 'VALUE'
}

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
  createdAt: Scalars['DateTime'];
  createdBy: User;
  currentVersion: ScenarioVersion;
  id: Scalars['ID'];
  name: Scalars['String'];
  namespace: Namespace;
  priorVersions: Array<ScenarioVersion>;
};

export type ScenarioVersion = {
  __typename?: 'ScenarioVersion';
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  end?: Maybe<Scalars['String']>;
  eventDelta?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  scenario: Scenario;
  seed?: Maybe<Scalars['Int']>;
  start?: Maybe<Scalars['String']>;
};

export type Simulation = {
  __typename?: 'Simulation';
  branch: Branch;
  completedAt?: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  end?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  scenarioVersion?: Maybe<ScenarioVersion>;
  seed?: Maybe<Scalars['Int']>;
  start?: Maybe<Scalars['DateTime']>;
  streams: Array<SimulationStream>;
};

export type SimulationStream = {
  __typename?: 'SimulationStream';
  metadataUrl: Scalars['String'];
  outputs: Array<SimulationStreamOutput>;
  streamVersion: StreamVersion;
  systems: Array<SimulationStreamSystem>;
};

export type SimulationStreamOutput = {
  __typename?: 'SimulationStreamOutput';
  dataUrl: Scalars['String'];
  format: OutputFormat;
  mode: OutputMode;
};

export type SimulationStreamSystem = {
  __typename?: 'SimulationStreamSystem';
  scriptUrls: Array<Scalars['String']>;
  systemVersion: SystemVersion;
};

export type Stream = {
  __typename?: 'Stream';
  branch: Branch;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  currentVersion: StreamVersion;
  id: Scalars['ID'];
  name: Scalars['String'];
  namespace: Namespace;
  priorVersions: Array<StreamVersion>;
};

export type StreamOutput = {
  __typename?: 'StreamOutput';
  format: OutputFormat;
  mode: OutputMode;
};

export type StreamSystem = {
  __typename?: 'StreamSystem';
  parameters: Array<StreamSystemParameter>;
  streamVersion: StreamVersion;
  systemVersion: SystemVersion;
};

export type StreamSystemParameter = {
  __typename?: 'StreamSystemParameter';
  key: Scalars['String'];
  value: Scalars['String'];
};

export type StreamVersion = {
  __typename?: 'StreamVersion';
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  id: Scalars['ID'];
  outputs: Array<StreamOutput>;
  references: Array<Stream>;
  schema: Scalars['JSONObject'];
  stream: Stream;
  streamSystems: Array<StreamSystem>;
};

export type System = {
  __typename?: 'System';
  branch: Branch;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  currentVersion: SystemVersion;
  id: Scalars['ID'];
  name: Scalars['String'];
  namespace: Namespace;
  priorVersions: Array<SystemVersion>;
};

export type SystemParameter = {
  __typename?: 'SystemParameter';
  default?: Maybe<Scalars['String']>;
  env?: Maybe<Scalars['String']>;
  key: Scalars['String'];
};

export type SystemVersion = {
  __typename?: 'SystemVersion';
  configFile?: Maybe<ConfigFile>;
  createdAt: Scalars['DateTime'];
  createdBy: User;
  id: Scalars['ID'];
  parameters: Array<SystemParameter>;
  system: System;
};

export type UpsertBranch = {
  draft?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
  organizationId: Scalars['ID'];
};

export type UpsertConfigFile = {
  config: Scalars['JSONObject'];
  scm?: InputMaybe<UpsertConfigFileScm>;
};

export type UpsertConfigFileScm = {
  branch: Scalars['String'];
  commit?: InputMaybe<Scalars['String']>;
  filepath: Scalars['String'];
  parentCommit: Scalars['String'];
  repo: Scalars['String'];
};

export type UpsertNamespace = {
  name: Scalars['String'];
  organizationId: Scalars['ID'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type ValidateConfigFile = {
  config: Scalars['JSONObject'];
};

export type VerifiedCliAuth = {
  __typename?: 'VerifiedCliAuth';
  token: Scalars['String'];
};

export type VerifyCliAuth = {
  cliAuthId: Scalars['String'];
  userCode: Scalars['String'];
};

export type AuthCliMutationVariables = Exact<{ [key: string]: never; }>;


export type AuthCliMutation = { __typename?: 'Mutation', authCli: { __typename?: 'CliAuth', cliCode: string, userCode: string, verificationUrl: string } };

export type GetVerifiedCliAuthQueryVariables = Exact<{
  cliCode: Scalars['String'];
}>;


export type GetVerifiedCliAuthQuery = { __typename?: 'Query', verifiedCliAuth?: { __typename?: 'VerifiedCliAuth', token: string } | null };

export type GetOrganizationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationsQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name: string, createdAt: any }> };

export type UpsertConfigFileMutationVariables = Exact<{
  input: UpsertConfigFile;
}>;


export type UpsertConfigFileMutation = { __typename?: 'Mutation', upsertConfigFile: { __typename?: 'ConfigFile', id: string, branch: { __typename?: 'Branch', id: string } } };

export type CreateSimulationMutationVariables = Exact<{
  input: CreateSimulation;
}>;


export type CreateSimulationMutation = { __typename?: 'Mutation', createSimulation: { __typename?: 'Simulation', id: string } };

export type GetSimulationQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetSimulationQuery = { __typename?: 'Query', simulation?: { __typename?: 'Simulation', id: string, completedAt?: any | null, streams: Array<{ __typename?: 'SimulationStream', metadataUrl: string, streamVersion: { __typename?: 'StreamVersion', stream: { __typename?: 'Stream', name: string } }, outputs: Array<{ __typename?: 'SimulationStreamOutput', dataUrl: string }>, systems: Array<{ __typename?: 'SimulationStreamSystem', scriptUrls: Array<string>, systemVersion: { __typename?: 'SystemVersion', system: { __typename?: 'System', name: string } } }> }> } | null };


export const AuthCliDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthCli"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authCli"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cliCode"}},{"kind":"Field","name":{"kind":"Name","value":"userCode"}},{"kind":"Field","name":{"kind":"Name","value":"verificationUrl"}}]}}]}}]} as unknown as DocumentNode<AuthCliMutation, AuthCliMutationVariables>;
export const GetVerifiedCliAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVerifiedCliAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cliCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifiedCliAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cliCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cliCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]} as unknown as DocumentNode<GetVerifiedCliAuthQuery, GetVerifiedCliAuthQueryVariables>;
export const GetOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationsQuery, GetOrganizationsQueryVariables>;
export const UpsertConfigFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"upsertConfigFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertConfigFile"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertConfigFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"branch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpsertConfigFileMutation, UpsertConfigFileMutationVariables>;
export const CreateSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSimulation"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSimulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateSimulationMutation, CreateSimulationMutationVariables>;
export const GetSimulationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getSimulation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"streams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataUrl"}},{"kind":"Field","name":{"kind":"Name","value":"streamVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stream"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"outputs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"systems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemVersion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"scriptUrls"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<GetSimulationQuery, GetSimulationQueryVariables>;