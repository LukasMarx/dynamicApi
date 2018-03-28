import { graphql } from 'graphql';
import { dynamicSchemaService } from '../services/typeService';
import { jsonToSchemaService } from '../services/jsonToSchemaService';
import { contentService } from '../services/contentService';
import * as getFieldNames from 'graphql-list-fields';
import { makeExecutableSchema } from 'graphql-tools';
import { Type } from '../models/type';
import { Response, Request, NextFunction, Router } from 'express';
import { dynamicJWT } from '../passport/dynamicJwt';
import { auth } from 'google-auth-library';
import { createLoaders } from '../data-loader';

export const publicApi = Router();

publicApi.use(dynamicJWT);

export const getApi = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;

    const authenticationInfo = req.authInfo;

    const schema = await generateContentSchema(projectId);
    let variables;
    if (typeof req.query.variables === 'string') {
        variables = JSON.parse(req.query.variables);
    } else {
        variables = req.query.variables;
    }

    const context = Object.assign(authenticationInfo, createLoaders(projectId, authenticationInfo.method, authenticationInfo.userId, true));

    const result = await graphql(schema, req.query.query, null, context, variables);
    if (result) res.send(result);
};

export const postApi = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;

    const authenticationInfo = req.authInfo;
    const body = req.body;

    const schema = await generateContentSchema(projectId);

    const context = Object.assign(authenticationInfo, createLoaders(projectId, authenticationInfo.method, authenticationInfo.userId, true));

    const result = await graphql(schema, body.query, null, authenticationInfo, body.variables);
    if (result) res.send(result);
};

const generateContentSchema = async (projectId: string) => {
    const types = await dynamicSchemaService.getAllTypes(projectId);
    const fields = {};

    const s = await jsonToSchemaService.convert(projectId, types);

    const resolvers = { Mutation: {}, Query: {} };

    for (let type of types) {
        const customTypedFields = jsonToSchemaService.getAllCustomTypedFields(type);

        customTypedFields.forEach(field => {
            if (!resolvers[type.name]) resolvers[type.name] = {};

            if (field.list) {
                resolvers[type.name][field.name] = async (obj: any, args: any, context: any, info: any) => {
                    const fieldType = await context.typeLoader.load(field.type);
                    const filter = { field: ['_refs'], value: { type: type.name, field: field.name, id: obj.id } };
                    if (args.filter) {
                        args.filter.push(filter);
                    }
                    return contentService.getAllAsConnection(
                        projectId,
                        fieldType,
                        {
                            filter: args.filter ? args.filter : [filter],
                            skip: args.skip,
                            after: args.after,
                            descending: args.descending,
                            limit: args.limit,
                            fields: getFieldNames(info),
                            orderBy: args.orderBy
                        },
                        false,
                        context.method,
                        context.userId
                    );
                    // return context.contentLoaderMany.load({
                    //     type: fieldType,
                    //     filter: {
                    //         filter: args.filter ? args.filter : [filter],
                    //         skip: args.skip,
                    //         after: args.after,
                    //         descending: args.descending,
                    //         limit: args.limit,
                    //         fields: getFieldNames(info),
                    //         orderBy: args.orderBy
                    //     }
                    // });
                };

                resolvers.Mutation['assign' + field.name + 'To' + type.name] = async (obj: any, args: any, context: any, info: any) => {
                    const fieldType = await context.typeLoader.load(field.type);
                    if (args.assignments) {
                        args.assignments.forEach(assignment => {
                            contentService.assign(projectId, type, fieldType, assignment.parent, assignment.child, field.name, context.method);
                        });
                    }
                };

                resolvers.Mutation['deassign' + field.name + 'From' + type.name] = async (obj: any, args: any, context: any, info: any) => {
                    const fieldType = await context.typeLoader.load(field.type);
                    if (args.assignments) {
                        args.assignments.forEach(assignment => {
                            contentService.deassign(projectId, type, fieldType, assignment.parent, assignment.child, field.name, context.method);
                        });
                    }
                };
            } else {
                resolvers[type.name][field.name] = async (obj: any, args: any, context: any, info: any) => {
                    if (obj[field.name] && obj[field.name].id) {
                        const filter = [{ field: 'id', value: obj[field.name].id }];
                        const fieldType = await context.typeLoader.load(field.type);
                        return context.contentLoader.load({ type: fieldType, filter: filter });
                    }
                };
            }
        });

        resolvers.Mutation['create' + type.name] = (obj: any, args: any, context: any, info: any) => {
            if (context.readOnly) {
                return null;
            }
            if (!canContinue('create', context.method, type, context.role)) {
                return null;
            }
            return contentService.insert(projectId, type, args.input, context.method, context.userId).catch(error => console.error(error));
        };
        resolvers.Mutation['update' + type.name] = (obj: any, args: any, context: any, info: any) => {
            if (context.readOnly) {
                return null;
            }
            if (!canContinue('update', context.method, type, context.role)) {
                return null;
            }
            return contentService.update(projectId, type, args.input.id, args.input, context.method).catch(error => console.error(error));
        };
        resolvers.Query[type.name + 's'] = (obj: any, args: any, context: any, info: any) => {
            if (!canContinue('readAll', context.method, type, context.role)) {
                return null;
            }
            return contentService
                .getAllAsConnection(
                    projectId,
                    type,
                    {
                        orderBy: args.orderBy,
                        descending: args.descending,
                        after: args.after,
                        skip: args.skip,
                        limit: args.limit,
                        filter: args.filter,
                        fields: getFieldNames(info)
                    },
                    true,
                    context.method,
                    context.userId
                )
                .catch(error => console.error(error));
        };
        resolvers.Query[type.name] = (obj: any, args: any, context: any, info: any) => {
            if (!canContinue('read', context.method, type, context.role)) {
                return null;
            }
            return contentService
                .get(
                    projectId,
                    type,
                    {
                        filter: args.filter,
                        fields: getFieldNames(info)
                    },
                    true,
                    context.method,
                    context.userId
                )
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

publicApi.get('/:projectId/api', getApi);
publicApi.post('/:projectId/api', postApi);
