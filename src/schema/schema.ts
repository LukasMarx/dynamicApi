import { makeExecutableSchema } from 'graphql-tools';
import { dynamicSchemaService } from '../services/dynamicSchemaService';
import { projectService } from '../services/projectService';
import { authKeyService } from '../services/authKeyService';
import { assetService } from '../services/assetService';

let cachedDb = null;

const typeDefs = `
  type Type {
    projectId: String!
    name: String!
    fields: [Field]
    permissions: [CrudPermission]
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
  }

  type Field {
    name: String!
    type: String!
    displayGroup: String
    fullPage: Boolean
  }

  input FieldInput {
    name: String!
    type: String!
    displayGroup: String
    fullPage: Boolean
  }

  type Account{
    id: String!
    email: String!
    forname: String
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

  type Query{
    type(projectId: String!, name: String): Type
    types(projectId: String!): [Type]
    project(id: String): Project
    projects: [Project]
    authKey(projectId: String!): String
    assets(projectId: String!): [Asset]
    asset(projectId: String!, name: String): Asset
  }

  type Mutation{
    renameType(projectId: String!, oldName: String!, newName: String!): Type
    removeType(projectId: String!, name: String): String
    updateType(projectId: String!, name: String!, type: TypeInput!): Type
    createType(projectId: String!, type: TypeInput!): Type
    createProject(input: ProjectInput): Project
  }
`;

const resolvers = {
  Query: {
    async type(obj: any, args: any, context: any, info: any)  {
      const res = await dynamicSchemaService.getType(args.projectId, args.name).catch();
      if (res.fields) {
        let array = [];
        for (let key in res.fields) {
          array.push(res.fields[key]);
        }
        (<any>res).fields = array;
      } else {
        (<any>res).fields = [];
      }

      if (res.permissions) {
        let array = [];
        for (let key in res.permissions) {
          array.push(res.permissions[key]);
        }
        (<any>res).permissions = array;
      } else {
        (<any>res).permissions = [];
      }
      return res;
    },
    async types(obj: any, args: any, context: any, info: any)  {
      const res = await dynamicSchemaService.getAllTypes(args.projectId).catch();
      res.forEach(type => {
        if (type.fields) {
          let array = [];
          for (let key in type.fields) {
            array.push(type.fields[key]);
          }
          (<any>type).fields = array;
        } else {
          (<any>type).fields = [];
        }
        if (type.permissions) {
          let array = [];
          for (let key in type.permissions) {
            array.push(type.permissions[key]);
          }
          (<any>type).permissions = array;
        } else {
          (<any>type).permissions = [];
        }
      });

      return res;
    },
    project(obj: any, args: any, context: any, info: any) {
      return projectService.getProject(args.id, args.name).catch();
    },
    projects(obj: any, args: any, context: any, info: any) {
      return projectService.getAllProjects(context.user.id);
    },
    authKey(obj: any, args: any, context: any, info: any) {
      return authKeyService.getKey(args.projectId);
    },
    assets(obj: any, args: any, context: any, info: any) {
      return assetService.getAll(args.projectId);
    },
    asset(obj: any, args: any, context: any, info: any) {
      return assetService.get(args.projectId, args.name);
    }
  },
  Project: {},
  Mutation: {
    createType(obj: any, args: any, context: any, info: any)  {
      return dynamicSchemaService.addType(args.projectId, args.type).catch();
    },
    updateType(obj: any, args: any, context: any, info: any)  {
      return dynamicSchemaService.updateType(args.projectId, args.name, args.type);
    },
    removeType(obj: any, args: any, context: any, info: any)  {
      return dynamicSchemaService.removeType(args.projectId, args.name);
    },

    createProject(obj: any, args: any, context: any, info: any)  {
      return projectService.addProject(context.user.id, args.input);
    }
  }
};

export const schema = makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers });
