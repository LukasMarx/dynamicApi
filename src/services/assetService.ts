import { Readable } from 'stream';
import { S3 } from 'aws-sdk';
import { Asset } from '../models/asset';
import * as mp from 'parse-multipart';
import { database } from './database';
import { Collection } from 'mongodb';

const s3 = new S3();

export class AssetService {
    async getAll(projectId: string): Promise<Asset[]> {
        const db = await database.connect();
        const assets = <Collection<any>>db.collection('assets.files');

        const result = await assets
            .find({ metadata: { projectId: projectId } })
            .toArray();

        result.map(file => {
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
