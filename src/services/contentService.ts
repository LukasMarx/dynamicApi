import { Type } from '../models/type';
import { v4 } from 'uuid';
import { database } from './database';
import { Collection, ObjectId } from 'mongodb';
import { Field, Visibility } from '../models/field';
import { isFieldVisible } from '../util/types';

export class ContentService {
    async insert(projectId: string, type: Type, value: any, authMethod: string, userId: string) {
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                throw new Error("You don't have access to the field " + key);
            }
        }

        const generatedEntity = this.generateEntity(projectId, type, value, userId);

        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        await values.insert(generatedEntity);

        return generatedEntity;
    }

    async get(projectId: string, type: Type, filter: any, isPublic: boolean = true, authMethod: string, userId: string) {
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const params: any = { projectId: projectId, type: type.name };
        if (isPublic && type.requiresPublication) {
            params.public = true;
        }

        if (filter.filter) {
            for (let input of filter.filter) {
                params[input.field] = input.value;
            }
        }

        const excluded = {};
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                excluded[key] = 0;
            }
        }

        const entities = await values
            .find(params, excluded)
            .project(excluded)
            .toArray();

        if (entities.length > 0) {
            const entity = entities[0];
            for (let key in type.fields) {
                if (type.fields[key].visibility == Visibility.OWNER && entity._owner !== userId) {
                    entity[key] = null;
                }
            }
            return entity;
        }
        return null;
    }

    async update(projectId: string, type: Type, id: string, value: any, authMethod: string) {
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                throw new Error("You don't have access to the field " + key);
            }
        }

        const generatedEntity = this.generateEntity(projectId, type, value, null);

        value.type = type.name;
        value.projectId = projectId;
        value.id = id;
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        values.updateOne({ projectId: projectId, id: id, type: type.name }, { $set: value });

        return value;
    }

    async assign(projectId: string, parentType: Type, targetType: Type, parentId: string, targetId: string, fieldName: string, authMethod: string) {
        // TODO Check Permissions
        // TODO Check for List-Property
        // TODO Batch?
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const update = {};
        update['_refs'] = { type: parentType.name, field: fieldName, id: parentId };
        await values.updateOne({ projectId: projectId, id: targetId, type: targetType.name }, { $addToSet: update });
    }

    async deassign(projectId: string, parentType: Type, targetType: Type, parentId: string, targetId: string, fieldName: string, authMethod: string) {
        // TODO Check Permissions
        // TODO Check for List-Property
        // TODO Batch?
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const update = {};
        update['_refs'] = { type: parentType.name, field: fieldName, id: parentId };
        await values.updateOne({ projectId: projectId, id: targetId, type: targetType.name }, { $pull: update });
    }

    async getAll(
        projectId: string,
        type: Type,
        filter: {
            filter?: any[];
            orderBy?: string;
            descending?: boolean;
            limit?: number;
            skip?: number;
            after?: string;
            fields?: string[];
        },
        isPublic: boolean = true,
        authMethod: string,
        userId: string
    ) {
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const params: any = {};
        if (filter.filter) {
            for (let input of filter.filter) {
                params[input.field] = input.value;
            }
        }
        params.projectId = projectId;
        params.type = type.name;
        if (isPublic && type.requiresPublication) {
            params.public = true;
        }

        const excluded = {};
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                excluded[key] = 0;
            }
        }

        const result = await values
            .find(params)
            .sort(filter.orderBy || '_id', filter.descending ? -1 : 1)
            .skip(filter.skip || 0)
            .limit(filter.limit || 0)
            .project(excluded)
            .toArray();

        if (result.length > 0) {
            result.forEach(entity => {
                for (let key in type.fields) {
                    if (type.fields[key].visibility == Visibility.OWNER && entity._owner !== userId) {
                        entity[key] = null;
                    }
                }
            });
        }

        return result;
    }

    async getAllAsConnection(
        projectId: string,
        type: Type,
        filter: {
            filter?: any[];
            orderBy?: string;
            descending?: boolean;
            limit?: number;
            skip?: number;
            after?: string;
            fields?: string[];
        },
        isPublic: boolean = true,
        authMethod: string,
        userId: string
    ) {
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const params: any = {};
        if (filter.filter) {
            for (let input of filter.filter) {
                params[input.field] = input.value;
            }
        }
        params.projectId = projectId;
        params.type = type.name;
        if (isPublic && type.requiresPublication) {
            params.public = true;
        }

        const excluded = {};
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                excluded[key] = 0;
            }
        }

        let cursor = values.find(params);
        if (filter.orderBy) {
            const val = {};
            val[filter.orderBy] = filter.descending ? -1 : 1;
            cursor = cursor.sort(val);
        }

        // const resultArray = await values.aggregate([this.getAggregation(filter, params)]).toArray();
        const results = await Promise.all([cursor.toArray(), values.count(params)]);
        const result = { edges: results[0], totalCount: results[1], nodes: null, pageInfo: null };

        // if (!resultArray || !resultArray[0]) {
        //     return [];
        // }
        // const result = resultArray[0];

        let hasNextPage = false;
        // if (filter.limit) {
        //     if (result.edges.length === filter.limit + 1) {
        //         hasNextPage = true;
        //         result.edges.pop();
        //     }
        // }

        result.nodes = result.edges;
        result.edges = result.edges.map(edge => {
            return {
                cursor: edge._id.toString('base64'),
                node: edge
            };
        });
        // if (result.edges.length > 0) {
        //     result.pageInfo = {
        //         startCursor: result.edges[0].cursor,
        //         endCursor: result.edges[result.edges.length - 1].cursor,
        //         hasNextPage: hasNextPage
        //     };
        // } else {
        //     result.pageInfo = {
        //         startCursor: null,
        //         endCursor: null,
        //         hasNextPage: false
        //     };
        // }

        // if (result.length > 0) {
        //     result.forEach(entity => {
        //         for (let key in type.fields) {
        //             if (type.fields[key].visibility == Visibility.OWNER && entity._owner !== userId) {
        //                 entity[key] = null;
        //             }
        //         }
        //     });
        // }

        return result;
    }

    getAggregation(
        filter: {
            filter?: any[];
            orderBy?: string;
            descending?: boolean;
            limit?: number;
            skip?: number;
            after?: string;
            fields?: string[];
        },
        params
    ) {
        const aggregation = {
            $facet: {
                edges: [{ $match: params }],
                count: [{ $match: params }, { $group: { _id: null, count: { $sum: 1 } } }]
            }
        };
        if (filter.orderBy) {
            const sort = { $sort: {} };
            sort.$sort[filter.orderBy] = filter.descending ? -1 : 1;
            aggregation.$facet.edges.push(<any>sort);

            if (filter.after) {
                const tokenString = Buffer.from(filter.after, 'base64').toString('hex');
                const split = tokenString.split('-');
                const objectId = split[0];
                const dynamicOrderBy = split[0];
                const sortTokenQuery = {};
                let sortIdQuery;

                if (filter.descending) {
                    sortTokenQuery[filter.orderBy] = { $gt: dynamicOrderBy };
                    sortIdQuery = { _id: { $lt: new ObjectId(objectId) } };
                } else {
                    sortTokenQuery[filter.orderBy] = { $lt: dynamicOrderBy };
                    sortIdQuery = { _id: { $gt: new ObjectId(objectId) } };
                }

                aggregation.$facet.edges.push({
                    $match: { $and: [sortIdQuery, sortTokenQuery] }
                });
            }
        } else {
            if (filter.after) {
                const tokenString = Buffer.from(filter.after, 'base64').toString('hex');
                let sortIdQuery;

                if (filter.descending) {
                    sortIdQuery = { _id: { $lt: new ObjectId(tokenString) } };
                } else {
                    sortIdQuery = { _id: { $gt: new ObjectId(tokenString) } };
                }

                aggregation.$facet.edges.push({
                    $match: sortIdQuery
                });
            }
        }
        if (filter.skip) {
            aggregation.$facet.edges.push(<any>{ $skip: filter.skip || 0 });
        }
        if (filter.limit) {
            aggregation.$facet.edges.push(<any>{ $limit: filter.limit + 1 || 0 });
        }

        return aggregation;
    }

    getExternFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
            if (field.type === 'BIG_TEXT') result.push(field);
        }
        return result;
    }

    getFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
            result.push(field);
        }
        return result;
    }

    getUniqueFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
            if (field.unique) result.push(field);
        }
        return result;
    }

    getInternFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
        }
        return result;
    }

    private generateEntity(projectId: string, type: Type, value: any, userId: string) {
        const generatedEntity: any = {};

        generatedEntity.type = type.name;
        generatedEntity.projectId = projectId;
        generatedEntity.id = v4();
        if (userId) {
            generatedEntity._owner = userId;
        }

        for (let key in type.fields) {
            let field = type.fields[key];
            if (!value[field.name]) continue;

            switch (field.type) {
                case 'STRING': {
                    if (typeof field.name === 'string') generatedEntity[field.name] = value[field.name];
                    break;
                }
                case 'INTEGER': {
                    if (!isNaN(value[field.name])) {
                        generatedEntity[field.name] = Math.floor(value[field.name]);
                    }
                    break;
                }
                case 'FLOAT': {
                    if (!isNaN(value[field.name])) {
                        generatedEntity[field.name] = value[field.name];
                    }
                    break;
                }
                case 'BINARY': {
                    generatedEntity[field.name] = value[field.name];
                }
                case 'BIG_TEXT': {
                }
                case 'BIG_BINARY': {
                }
                case 'ASSET': {
                    generatedEntity[field.name] = value[field.name];
                }
                case 'DATE': {
                    generatedEntity[field.name] = value[field.name];
                }
            }
        }
        return generatedEntity;
    }
}

export const contentService = new ContentService();
