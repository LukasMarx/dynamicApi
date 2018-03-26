import { Readable } from 'stream';
import { Asset } from '../models/asset';
import * as mp from 'parse-multipart';
import { database } from './database';
import { Collection } from 'mongodb';

export class AssetService {
    async getAll(projectId: string): Promise<Asset[]> {
        const db = await database.connect();
        const assets = <Collection<any>>db.collection('assets.files');

        let result = await assets.find({ metadata: { projectId: projectId } }).toArray();

        result = result.map(file => {
            return {
                fileName: file.filename,
                size: file.length,
                type: file.contentType,
                projectId: file.metadata.projectId
            };
        });

        return result;
    }

    async get(projectId: string, id: string): Promise<Asset> {
        const db = await database.connect();
        const files = <Collection<any>>db.collection('assets.files');

        const file = await files.findOne({
            metadata: { projectId: projectId },
            filename: id
        });
        return {
            fileName: file.filename,
            size: file.length,
            type: file.contentType,
            projectId: file.metadata.projectId
        };
    }
}

export const assetService = new AssetService();
