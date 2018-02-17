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
    const assets = <Collection<Asset>>db.collection('assets');

    const result = await assets.find({ projectId: projectId }).toArray();

    return result;
  }

  async insert(projectId: string, event: any) {
    const boundary = mp.getBoundary(event.headers['content-type']);
    const bodyBuffer = new Buffer(event.body.toString(), 'base64');
    const files = mp.Parse(bodyBuffer, boundary);
    for (let key in files) {
      let file = files[key];

      const s3Parmas = {
        Bucket: 'grapqlcms',
        Key: 'images/' + projectId + file.filename,
        Body: file.data,
        ContentType: file.type
      };

      await s3.putObject(s3Parmas).promise();

      const asset = new Asset();
      asset.fileName = file.filename;
      asset.projectId = projectId;
      asset.type = file.type;
      asset.size = file.data.length;

      const db = await database.connect();
      const assets = <Collection<Asset>>db.collection('assets');

      await assets.insertOne(asset);
      return asset;
    }
  }

  async get(projectId: string, id: string): Promise<Asset> {
    const db = await database.connect();
    const assets = <Collection<Asset>>db.collection('assets');

    return assets.findOne({ projectId: projectId, fileName: id });
  }

  async getBlob(projectId: string, name: string, width?: number, format?: string): Promise<any> {
    let key = 'images/' + projectId + name;

    const s3Parmas: any = {
      Bucket: 'grapqlcms',
      Key: key
    };
    const firstTry = await s3.getObject(s3Parmas).promise();
    return firstTry;
  }
}

export const assetService = new AssetService();
