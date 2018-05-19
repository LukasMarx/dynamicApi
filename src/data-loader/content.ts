import { Filter } from '../models/filter';
import { Type } from '../models/type';
import { database } from '../services/database';
import { Collection } from 'mongodb';
import { isFieldVisible } from '../util/types';
import { Visibility } from '../models/field';

export interface ContentLoaderParams {
    type: Type;
    filter: Filter[];
}

export async function genContent(projectId: string, authMethod: string, userId: string, isPublicAPI: boolean, params: ContentLoaderParams[]) {
    const db = await database.connect();
    const values = <Collection<any>>db.collection('values');

    const queries = params.map(x => {
        const query = { type: x.type.name };
        if (x.filter) {
            x.filter.forEach(f => {
                query[f.field] = f.value;
            });
        }
        return query;
    });

    const result = await values.find({ projectId: projectId, $or: queries }).toArray();
    return result;
}

async function runFindOne(projectId: string, authMethod: string, userId: string, isPublicAPI: boolean, params: ContentLoaderParams[], values) {
    let reqParams = createQueryParamsFromFilter(projectId, params[0].type, params[0].filter, isPublicAPI);
    let excluded = createExcludedParams(params[0].type, authMethod);

    return [values.findOne(reqParams, excluded)];
}

async function runAggregation(projectId: string, authMethod: string, userId: string, isPublicAPI: boolean, params: ContentLoaderParams[], values) {
    const queries = [];
    params.forEach(param => {
        let reqParams = createQueryParamsFromFilter(projectId, param.type, param.filter, isPublicAPI);
        let excluded = createExcludedParams(param.type, authMethod);
        queries.push(createQuery(reqParams, excluded));
    });
    const aggregation = createAggregationFromQueries(queries);

    const result = await values.aggregate(aggregation).toArray();

    const filteredResult = filterResult(result, params, userId);

    return filteredResult;
}

function createQueryParamsFromFilter(projectId: string, type: Type, filter: Filter[], isPublicAPI: boolean) {
    const queryParams: any = { projectId: projectId, type: type.name };
    if (isPublicAPI && type.requiresPublication) {
        queryParams.public = true;
    }
    if (filter.filter) {
        for (let input of filter) {
            queryParams[input.field] = input.value;
        }
    }
    return queryParams;
}

function createExcludedParams(type: Type, authMethod: string) {
    const excluded = {};
    for (let key in type.fields) {
        if (!isFieldVisible(type.fields[key], authMethod)) {
            excluded[key] = 0;
        }
    }
    return excluded;
}

function createQuery(params, excluded) {
    return [{ $match: params }, { $project: excluded }, { $limit: 1 }];
}

function createAggregationFromQueries(queries: any[]) {
    const aggregation = { $facet: {} };

    queries.forEach((query, index) => {
        aggregation.$facet[index] = query;
    });

    return [aggregation];
}

function filterResult(input: any[], params: ContentLoaderParams[], userId: string) {
    const result = [];
    for (let key in input[0]) {
        try {
            let index = parseInt(key);
            const entity = input[0][key][0];
            for (let key in params[index].type.fields) {
                if (params[index].type.fields[key].visibility == Visibility.OWNER && entity._owner !== userId) {
                    entity[key] = null;
                }
            }
            result.push(entity);
        } catch (e) {}
    }
    return result;
}
