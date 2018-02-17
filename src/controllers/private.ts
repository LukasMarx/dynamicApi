import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import { dynamicSchemaService } from '../services/dynamicSchemaService';
import { jsonToSchemaService } from '../services/jsonToSchemaService';
import { contentService } from '../services/contentService';
import * as getFieldNames from 'graphql-list-fields';
import { Response, Request, NextFunction } from "express";

export const getContent = async (req: Request, res: Response) => {
  const user = req.user;
  const projectId = req.params.variables.projectId;
  const schema = await generateContentSchema(projectId);

  const result = graphql(schema, req.query.query, null, { user: user })
    
};

export const postContent = async (req: Request, res: Response) => {
  const user = req.user;
  const body = req.body;
  const projectId = body.variables.projectId;
  const schema = await generateContentSchema(projectId);

  const result = await graphql(schema, body.query, null, { user: user }, body.variables);
  if(result) res.send(result);
   
};

const generateContentSchema = async (projectId: string) => {
  const types = await dynamicSchemaService.getAllTypes(projectId);

  const s = await jsonToSchemaService.convertAdmin(projectId, types);
  const resolvers = { Mutation: {}, Query: {} };

  for (let type of types) {
    resolvers.Mutation['create' + type.name] = (obj: any, args: any, context: any, info: any)  => {
      return contentService
        .insert(projectId, type, args.input)
        .catch(error => console.error(error));
    };
    resolvers.Mutation['update' + type.name] = (obj: any, args: any, context: any, info: any)  => {
      return contentService
        .update(args.projectId, type, args.input.id, args.input)
        .catch(error => console.error(error));
    };
    resolvers.Query[type.name + 's'] = (obj: any, args: any, context: any, info: any)  => {
      return contentService
        .getAll(args.projectId, type, { fields: getFieldNames(info) }, false)
        .catch(error => console.error(error));
    };
    resolvers.Query[type.name] = (obj: any, args: any, context: any, info: any)  => {
      return contentService
        .get(
          args.projectId,
          type,
          { filter: [{ field: 'id', value: args.id }], fields: getFieldNames(info) },
          false
        )
        .catch(error => console.error(error));
    };
  }
  return makeExecutableSchema({ typeDefs: s, resolvers: resolvers });
};
