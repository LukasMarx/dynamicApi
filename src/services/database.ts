import { MongoClient, Db } from 'mongodb';

let cachedDb: any = null;

let uri = process.env.MONGODB;

export class Database {
  public connect(): Promise<Db> {
    if (cachedDb && cachedDb.serverConfig.isConnected()) {
      return Promise.resolve(cachedDb);
    }

    return MongoClient.connect(uri).then(async client => {
      cachedDb = client.db('cms');
      return cachedDb;
    }).catch(error => console.error(error));
  }
}

export const database = new Database();
