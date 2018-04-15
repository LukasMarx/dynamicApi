import * as DataLoader from 'dataloader';
import { genContent, ContentLoaderParams } from './content';
import { genType } from './type';
import { queryContent } from './content-loader';

//{ projectId: projectId, authMethod: authMethod, userId: userId, isPublicAPI: isPublic, params: <any>params }
export function createLoaders(projectId: string, authMethod: string, userId: string, isPublic: boolean) {
    return {
        contentLoader: new DataLoader(params => genContent(projectId, authMethod, userId, isPublic, <any>params), {
            cacheKeyFn: objectCacheKeyFn
        }),
        typeLoader: new DataLoader(names => genType(projectId, <string[]>names), { cacheKeyFn: objectCacheKeyFn })
    };
}

const objectCacheKeyFn = key => {
    if (typeof key === 'object') {
        return JSON.stringify(
            Object.keys(key)
                .sort()
                .reduce((acc, val) => {
                    acc[val] = key[val];
                    return acc;
                }, {})
        );
    } else {
        return key;
    }
};
