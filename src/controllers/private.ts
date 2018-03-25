import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import { dynamicSchemaService } from '../services/typeService';
import { jsonToSchemaService } from '../services/jsonToSchemaService';
import { contentService } from '../services/contentService';
import * as getFieldNames from 'graphql-list-fields';
import { Response, Request, NextFunction } from 'express';
import { agent } from 'supertest';

export const getContent = async (req: Request, res: Response) => {
    const user = req.user;
    const projectId = req.params.variables.projectId;
    const schema = await generateContentSchema(projectId);

    const result = graphql(schema, req.query.query, null, { user: user });
};

export const postContent = async (req: Request, res: Response) => {
    const user = req.user;
    const body = req.body;
    const projectId = body.variables.projectId;
    const schema = await generateContentSchema(projectId);

    const result = await graphql(schema, body.query, null, { user: user }, body.variables);
    if (result) res.send(result);
};

const generateContentSchema = async (projectId: string) => {
    const types = await dynamicSchemaService.getAllTypes(projectId);

    const s = await jsonToSchemaService.convertAdmin(projectId, types);
    const resolvers = { Mutation: {}, Query: {} };

    for (let type of types) {
        const customTypedFields = jsonToSchemaService.getAllCustomTypedFields(type);

        customTypedFields.forEach(field => {
            if (!resolvers[type.name]) resolvers[type.name] = {};

            if (field.list) {
                resolvers[type.name][field.name] = async (obj: any, args: any, context: any, info: any) => {
                    const fieldType = await dynamicSchemaService.getType(projectId, field.type);
                    const filter = { field: ['_refs'], value: { type: type.name, field: field.name, id: obj.id } };
                    return contentService.getAllAsConnection(
                        projectId,
                        fieldType,
                        {
                            filter: args.filter ? args.filter : [filter],
                            skip: args.skip,
                            after: args.after,
                            descending: args.descending,
                            limit: args.limit,
                            fields: args.fields,
                            orderBy: args.orderBy
                        },
                        false,
                        'admin',
                        context.userId
                    );
                };

                resolvers.Mutation['assign' + field.name + 'To' + type.name] = async (obj: any, args: any, context: any, info: any) => {
                    const fieldType = await dynamicSchemaService.getType(projectId, field.type);
                    if (args.assignments) {
                        args.assignments.forEach(assignment => {
                            contentService.assign(projectId, type, fieldType, assignment.parent, assignment.child, field.name, 'admin');
                        });
                    }
                };

                resolvers.Mutation['deassign' + field.name + 'From' + type.name] = async (obj: any, args: any, context: any, info: any) => {
                    const fieldType = await dynamicSchemaService.getType(projectId, field.type);
                    if (args.assignments) {
                        args.assignments.forEach(assignment => {
                            contentService.deassign(projectId, type, fieldType, assignment.parent, assignment.child, field.name, 'admin');
                        });
                    }
                };
            } else {
                resolvers[type.name][field.name] = async (obj: any, args: any, context: any, info: any) => {
                    if (!obj[field.name]) {
                        return null;
                    }
                    const filter = { id: obj[field.name].id };
                    const fieldType = await dynamicSchemaService.getType(projectId, field.type);
                    return contentService.get(projectId, fieldType, filter, false, 'admin', context.userId);
                };
            }
        });

        resolvers.Mutation['create' + type.name] = (obj: any, args: any, context: any, info: any) => {
            return contentService.insert(projectId, type, args.input, 'admin', context.userId).catch(error => console.error(error));
        };

        resolvers.Mutation['update' + type.name] = (obj: any, args: any, context: any, info: any) => {
            return contentService.update(args.projectId, type, args.input.id, args.input, 'admin').catch(error => console.error(error));
        };

        resolvers.Query[type.name + 's'] = (obj: any, args: any, context: any, info: any) => {
            return contentService.getAllAsConnection(
                projectId,
                type,
                {
                    filter: args.filter,
                    skip: args.skip,
                    after: args.after,
                    descending: args.descending,
                    limit: args.limit,
                    fields: args.fields,
                    orderBy: args.orderBy
                },
                false,
                'admin',
                context.userId
            );
        };

        resolvers.Query[type.name] = (obj: any, args: any, context: any, info: any) => {
            return contentService
                .get(
                    args.projectId,
                    type,
                    {
                        filter: args.filter,
                        fields: getFieldNames(info)
                    },
                    false,
                    'admin',
                    context.userId
                )
                .catch(error => console.error(error));
        };
    }
    return makeExecutableSchema({ typeDefs: s, resolvers: resolvers });
};
