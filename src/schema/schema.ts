import { makeExecutableSchema } from 'graphql-tools';

import { type, types, createType, updateType, removeType } from './resolvers/type';
import { project, projects, createProject } from './resolvers/project';
import { authKey } from './resolvers/authKey';
import { asset, assets } from './resolvers/asset';
import {
    createAuthenticationProvider,
    updateAuthenticationProvider,
    deleteAuthenticationProvider,
    authenticationProvider,
    authenticationProviders
} from './resolvers/authenticationProvider';

let cachedDb = null;

const typeDefs = `
  type Type {
    projectId: String!
    name: String!
    fields: [Field]
    permissions: [CrudPermission]
    requiresPublication: Boolean
  }

  type CrudPermission {
    role: String!
    read: Boolean!
    create: Boolean!
    update: Boolean!
    readAll: Boolean!
    delete: Boolean!
  }

  input CrudPermissionInput {
    role: String!
    read: Boolean!
    create: Boolean!
    update: Boolean!
    readAll: Boolean!
    delete: Boolean!
  }

  input TypeInput {
    projectId: String
    name: String!,
    fields: [FieldInput]
    permissions: [CrudPermissionInput]
    requiresPublication: Boolean
  }

  type Field {
    name: String!
    type: String!
    displayGroup: String
    fullPage: Boolean
    list: Boolean
    visibility: String
  }

  input FieldInput {
    name: String!
    type: String!
    displayGroup: String
    fullPage: Boolean
    list: Boolean
    visibility: String
  }

  type Account{
    id: String!
    email: String!
    forename: String
    surname: String
  }

  type Project{
    id: String!
    name: String!
    accountId: Account!
  }

  input ProjectInput{
    name: String!
  }

  type Asset {
    projectId: String!
    fileName: String!
    type: String!
    size: Int!
  }

  type AuthenticationProvider{
    id: String!
    name: String!
    cloudProvider: String!
    targetType: Type
    mappings: [AuthenticationMapping]
    projectId: String!
    clientId: String!
  }

  input AuthenticationProviderInput{
    name: String!
    cloudProvider: String!
    targetType: String!
    mappings: [AuthenticationMappingInput]
    clientId: String!
  }

  type AuthenticationMapping{
    userId: String!
    cloudProvider: String!
    name: String
    pictureUrl: String
  }

  input AuthenticationMappingInput{
    userId: String!
    cloudProvider: String!
    name: String
    pictureUrl: String
  }

  type Query{
    type(projectId: String!, name: String): Type
    types(projectId: String!): [Type]
    project(id: String): Project
    projects: [Project]
    authKey(projectId: String!): String
    assets(projectId: String!): [Asset]
    asset(projectId: String!, name: String): Asset
    authenticationProviders(projectId: String!): [AuthenticationProvider]
    authenticationProvider(projectId: String!, id: String!): AuthenticationProvider
  }

  type Mutation{
    renameType(projectId: String!, oldName: String!, newName: String!): Type
    removeType(projectId: String!, name: String): String
    updateType(projectId: String!, name: String!, type: TypeInput!): Type
    createType(projectId: String!, type: TypeInput!): Type
    createProject(input: ProjectInput!): Project
    createAuthenticationProvider(projectId: String!, authProvider: AuthenticationProviderInput!): AuthenticationProvider
    updateAuthenticationProvider(projectId: String!, id: String!, authProvider: AuthenticationProviderInput!): AuthenticationProvider
    deleteAuthenticationProvider(projectId: String!, id: String!): AuthenticationProvider
  }
`;

const resolvers = {
    Query: {
        type: type,
        types: types,
        project: project,
        projects: projects,
        authKey: authKey,
        asset: asset,
        assets: assets,
        authenticationProvider: authenticationProvider,
        authenticationProviders: authenticationProviders
    },
    Project: {},
    Mutation: {
        createType: createType,
        updateType: updateType,
        removeType: removeType,
        createProject: createProject,
        createAuthenticationProvider: createAuthenticationProvider,
        updateAuthenticationProvider: updateAuthenticationProvider,
        deleteAuthenticationProvider: deleteAuthenticationProvider
    }
};

export const schema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers
});
