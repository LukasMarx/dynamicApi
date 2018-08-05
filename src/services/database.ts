import * as mongo from 'mongodb';
import * as Grid from 'gridfs-stream';

let cachedDb: any = null;

let uri = process.env.MONGODB;

export class Database {
  public connect(): Promise<mongo.Db> {
    if (cachedDb && cachedDb.serverConfig.isConnected()) {
      return Promise.resolve(cachedDb);
    }

    const startTime = new Date().getTime();
    return mongo.MongoClient.connect(
      uri,
      {
        poolSize: 10,
        ha: true,
        haInterval: 5000,
        keepAlive: 1,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000
      }
    )
      .then(async client => {
        cachedDb = client.db('dynamicApi');
        cachedDb.collection('types').createIndex({ projectId: 1, name: 1 }, { background: true, unique: true });
        cachedDb.collection('values').createIndex({ type: 1, projectId: 1 }, { background: true });
        cachedDb.collection('values').createIndex({ projectId: 1, id: 1, type: 1 }, { background: true, unique: true });
        cachedDb.collection('values').createIndex({ projectId: 1, type: 1, public: 1 }, { background: true });
        cachedDb.collection('accounts').createIndex({ email: 1 }, { background: true, unique: true });
        cachedDb.collection('projectKeys').createIndex({ projectId: 1 }, { background: true, unique: true });
        cachedDb.collection('projects').createIndex({ accountId: 1 }, { background: true });
        cachedDb.collection('projects').createIndex({ id: 1 }, { background: true, unique: true });
        return cachedDb;
      })
      .catch();
  }

  public async gridFs(): Promise<Grid.Grid> {
    return Grid(await this.connect(), mongo);
  }
}

export const database = new Database();
