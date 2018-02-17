import { graphql } from 'graphql';
import { dynamicSchemaService } from '../services/dynamicSchemaService';
import { jsonToSchemaService } from '../services/jsonToSchemaService';
import { contentService } from '../services/contentService';
import * as getFieldNames from 'graphql-list-fields';
import { makeExecutableSchema } from 'graphql-tools';
import { Type } from '../models/type';
import { Response, Request, NextFunction, Router } from "express";
import { dynamicJWT } from '../passport/dynamicJwt';

export const publicApi = Router();

publicApi.use(dynamicJWT);


export const getApi = async (req: Request, res: Response)  => {

  const projectId = req.params.projectId;
  
  const authenticationInfo = req.authInfo;
  console.log(req.authInfo);

  const schema = await generateContentSchema(projectId);
  let variables;
  if (typeof req.query.variables === 'string') {
    variables = JSON.parse(req.query.variables);
  } else {
    variables = req.query.variables;
  }
  console.log(variables)
  const result = await graphql(schema, req.query.query, null, authenticationInfo, variables);
  if(result) res.send(result);
};

export const postApi = async (req: Request, res: Response)  => {
  const projectId = req.params.projectId;

  const authenticationInfo = req.authInfo;
  const body = req.body;

  const schema = await generateContentSchema(projectId);

  const result = await graphql(schema, body.query, null, authenticationInfo, body.variables);
  if(result) res.send(result);

};

const generateContentSchema = async (projectId: string) => {
  const types = await dynamicSchemaService.getAllTypes(projectId);
  const fields = {};

  const s = await jsonToSchemaService.convert(projectId, types);

  const resolvers = { Mutation: {}, Query: {} };

  for (let type of types) {
    resolvers.Mutation['create' + type.name] = (obj: any, args: any, context: any, info: any)  => {
      if (context.readOnly) {
        return null;
      }
      if (!canContinue('create', context.method, type, context.role)) {
        return null;
      }
      return contentService
        .insert(projectId, type, args.input)
        .catch(error => console.error(error));
    };
    resolvers.Mutation['update' + type.name] = (obj: any, args: any, context: any, info: any)  => {
      if (context.readOnly) {
        return null;
      }
      if (!canContinue('update', context.method, type, context.role)) {
        return null;
      }
      return contentService
        .update(projectId, type, args.input.id, args.input)
        .catch(error => console.error(error));
    };
    resolvers.Query[type.name + 's'] = (obj: any, args: any, context: any, info: any)  => {
      if (!canContinue('readAll', context.method, type, context.role)) {
        return null;
      }
      return contentService
        .getAll(projectId, type, {
          orderBy: args.orderBy,
          descending: args.descending,
          skip: args.skip,
          limit: args.limit,
          filter: args.filter,
          fields: getFieldNames(info)
        })
        .catch(error => console.error(error));
    };
    resolvers.Query[type.name] = (obj: any, args: any, context: any, info: any)  => {
      if (!canContinue('read', context.method, type, context.role)) {
        return null;
      }
      return contentService
        .get(projectId, type, { filter: [args.filter], fields: getFieldNames(info) })
        .catch(error => console.error(error));
    };
  }
  return makeExecutableSchema({ typeDefs: s, resolvers: resolvers });
};

function canContinue(crud: string, method: string, type: Type, role?: string) {
  if (!type.permissions) return false;
  switch (method) {
    case 'anonymous': {
      if (type.permissions.anonymous[crud]) {
        return true;
      }
      break;
    }
    case 'authKey': {
      if (type.permissions.authKey[crud]) {
        return true;
      }
      break;
    }
    case 'user': {
      if (type.permissions.perRole[role][crud]) {
        return true;
      }
      break;
    }
  }
  return false;
}

publicApi.get('/:projectId/api',getApi);
publicApi.post('/:projectId/api',postApi);