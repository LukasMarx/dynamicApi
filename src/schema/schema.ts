import { makeExecutableSchema } from 'graphql-tools';

import { type, types, createType, updateType, removeType } from './resolvers/type';
import { project, projects, createProject } from './resolvers/project';
import { authKey } from './resolvers/authKey';
import { asset, assets, deleteAsset } from './resolvers/asset';
import {
    createAuthenticationProvider,
    updateAuthenticationProvider,
    deleteAuthenticationProvider,
    authenticationProvider,
    authenticationProviders
} from './resolvers/authenticationProvider';
import { pages, createPage, updatePage } from './resolvers/page';

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
    id: ID!
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

  type Widget{
    top: Int
    left: Int
    width: Int
    height: Int
    component: String
    configuration: String
  }
  
  type Page {
    id: String!
    tab: String
    widgets: [Widget]
  }

  input WidgetInput{
    top: Int
    left: Int
    width: Int
    height: Int
    component: String
  }

  input PageInput {
    tab: String
    widgets: [WidgetInput]
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
    pages(projectId: String!, type: String!): [Page]
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
    deleteAsset(projectId: String!, id: String!): String
    createPage(projectId: String!, type: String!, page: PageInput!): Page
    updatePage(projectId: String!, id: String!, page: PageInput!): Page
  }
`;

const resolvers = {
    Query: {
        type,
        types,
        project,
        projects,
        authKey,
        asset,
        assets,
        authenticationProvider,
        authenticationProviders,
        pages: pages
    },
    Project: {},
    Mutation: {
        createType,
        updateType,
        removeType,
        createProject,
        createAuthenticationProvider,
        updateAuthenticationProvider,
        deleteAuthenticationProvider,
        deleteAsset: deleteAsset,
        createPage,
        updatePage
    }
};

export const schema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers
});
