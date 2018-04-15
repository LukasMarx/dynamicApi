import { Type } from '../models/type';
import { Filter } from '../models/filter';
import { database } from '../services/database';
import { Collection } from 'mongodb';
import { isFieldVisible } from '../util/types';
import { Visibility } from '../models/field';

export interface ContentLoaderParams {
    projectId: string;

    authMethod: string;

    userId: string;

    isPublicAPI: boolean;

    params: {
        type: Type;
        expectOne: boolean;
        filter: Filter[];
        skip: number;
        after: number;
        descending: boolean;
        limit: number;
        fields: string[];
        orderBy: string;
    }[];
}

export async function queryContent(params: ContentLoaderParams) {
    const db = await database.connect();
    const values = <Collection<any>>db.collection('values');

    let queries = [];
    const appendedQueries = [];

    let numberOfCountOperations = 0;

    params.params.forEach((param, index) => {
        let reqParams = createQueryParamsFromFilter(params, index);
        let excluded = createExcludedParams(params, index);
        queries.push(createQuery(param, reqParams, excluded));

        if (!param.expectOne) {
            appendedQueries.push(createQuery(param, reqParams, excluded, true));
            numberOfCountOperations++;
        }
    });
    queries = queries.concat(appendedQueries);

    const aggregation = createAggregationFromQueries(queries);

    const para = params.params.map(p => {
        let proto = { projectId: params.projectId, public: p.type.requiresPublication ? true : null, type: p.type.name };
        if (p.filter) {
            p.filter.forEach(filter => {
                proto[filter.field] = filter.value;
            });
        }
        return proto;
    });

    const test = await values
        .find({
            $or: para
        })
        .toArray();
    const result = await values.aggregate(aggregation).toArray();

    //const counts = result[0].splice(params.params.length - numberOfCountOperations, numberOfCountOperations);

    // let filteredResult = filterResult(result, params, params.userId);

    // filteredResult = filteredResult.map(e => {
    //     if (e instanceof Array) {
    //         return {
    //             edges: e.map(f => {
    //                 return {
    //                     cursor: f._id.toString('base64'),
    //                     node: f
    //                 };
    //             }),
    //             nodes: e
    //         };
    //     } else {
    //         return e;
    //     }
    // });

    return test;
}

function createQueryParamsFromFilter(param: ContentLoaderParams, index: number) {
    const queryParams: any = { projectId: param.projectId, type: param.params[index].type.name };
    if (param.isPublicAPI && param.params[index].type.requiresPublication) {
        queryParams.public = true;
    }
    if (param.params[index].filter && param.params[index].filter.filter) {
        for (let input of param.params[index].filter) {
            queryParams[input.field] = input.value;
        }
    }
    return queryParams;
}

function createExcludedParams(param: ContentLoaderParams, index: number) {
    const excluded = {};
    for (let key in param.params[index].type.fields) {
        if (!isFieldVisible(param.params[index].type.fields[key], param.authMethod)) {
            excluded[key] = 0;
        }
    }
    return excluded;
}

function createQuery(param, queryParams: any, excluded: any, count?: boolean) {
    const result: any = [{ $match: queryParams }];
    // if (excluded && Object.keys(excluded).length > 0) {
    //     result.push({ $project: excluded });
    // }
    if (param.expectOne) {
        result.push({ $limit: 1 });
    }
    if (count) {
        //result.push({ $group: { _id: null, count: { $sum: 1 } } });
    }
    return result;
}

function createAggregationFromQueries(queries: any[]) {
    const aggregation = { $facet: {} };

    queries.forEach((query, index) => {
        aggregation.$facet[index] = query;
    });

    return [aggregation];
}

function filterResult(input: any[], param: ContentLoaderParams, userId: string) {
    const result = [];
    for (let key in input[0]) {
        try {
            let index = parseInt(key);
            if (param.params[index].expectOne) {
                const entity = input[0][key][0];
                for (let key in param.params[index].type.fields) {
                    if (param.params[index].type.fields[key].visibility == Visibility.OWNER && entity._owner !== userId) {
                        entity[key] = null;
                    }
                }
                result.push(entity);
            } else {
                const entities = input[0][key];
                for (let entity of entities) {
                    for (let key in param.params[index].type.fields) {
                        if (param.params[index].type.fields[key].visibility == Visibility.OWNER && entity._owner !== userId) {
                            entity[key] = null;
                        }
                    }
                }
                result.push(entities);
            }
        } catch (e) {}
    }
    return result;
}
