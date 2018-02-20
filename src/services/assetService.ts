import { Readable } from 'stream';
import { S3 } from 'aws-sdk';
import { Asset } from '../models/asset';
import * as mp from 'parse-multipart';
import { database } from './database';
import { Collection } from 'mongodb';

const s3 = new S3();

export class AssetService {
    async getAll(projectId: string) {
        const db = await database.connect();
        const assets = <Collection<Asset>>db.collection('assets.files');

        const result = await assets
            .find({ metadata: { projectId: projectId } })
            .toArray();

        return result;
    }

    async get(projectId: string, id: string): Promise<Asset> {
        const db = await database.connect();
        const assets = <Collection<Asset>>db.collection('assets.files');

        return assets.findOne({
            metadata: { projectId: projectId },
            filename: id
        });
    }
}

export const assetService = new AssetService();
