import * as mongo from 'mongodb';
import * as Grid from 'gridfs-stream';

let cachedDb: any = null;

let uri = process.env.MONGODB;

export class Database {
    public connect(): Promise<mongo.Db> {
        if (cachedDb && cachedDb.serverConfig.isConnected()) {
            return Promise.resolve(cachedDb);
        }

        return mongo.MongoClient.connect(uri)
            .then(async client => {
                cachedDb = client.db('dynamicApi');
                return cachedDb;
            })
            .catch(error => console.error(error));
    }

    public async gridFs(): Promise<Grid.Grid> {
        return Grid(await this.connect(), mongo);
    }
}

export const database = new Database();
