import { Type } from '../models/type';

import { database } from '../services/database';
import { Collection } from 'mongodb';
import { typeCache } from '../cache/type';

const cache = typeCache;

export async function genType(projectId: string, names: string[]) {
    const result = [];
    names.forEach((name, index) => {
        const cacheResult = <Type>cache.get(projectId + '_' + name);
        if (cacheResult) {
            result[index] = cacheResult;
        }
    });

    let toFetch = false;

    const aggregation = { $facet: {} };
    for (let i = 0; i < names.length; i++) {
        if (!result[i]) {
            aggregation.$facet[i] = [{ $match: { projectId: projectId, name: names[i] } }];
            toFetch = true;
        }
    }

    if (!toFetch) {
        return result;
    }

    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    const queryResult = await types.aggregate([aggregation]).toArray();

    const entities = queryResult[0];

    for (let key in entities) {
        result[parseInt(key)] = entities[key][0];
        //cache.set(projectId + '_' + entities[key][0].name, entities[key][0]);
    }

    return result;
}
