import { Response, Request, NextFunction } from 'express';
import { IncomingForm } from 'formidable';
import { database } from '../services/database';
import { Collection } from 'mongodb';
import { Asset } from '../models/asset';
import * as sharp from 'sharp';
import * as fs from 'fs';

import * as redis from 'redis';
import * as redisStreams from 'redis-streams';

redisStreams(redis);
const rClient = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, detect_buffers: true });

export const postAsset = async (req: Request, res: Response) => {
    const gfs = await database.gridFs();
    const db = await database.connect();
    const assets = <Collection<Asset>>db.collection('assets');
    const projectId = req.params.projectId;
    var form = new IncomingForm();

    form.on('file', (field, file) => {
        const options = {
            filename: file.name,
            mode: 'w',
            chunkSize: 1024,
            content_type: file.type,
            root: 'assets',
            metadata: {
                projectId: projectId
            }
        };
        var writeStream = gfs.createWriteStream(options);
        fs.createReadStream(file.path).pipe(writeStream);
    });
    form.on('end', () => {
        res.sendStatus(200);
    });
    form.parse(req);
};

export const getAsset = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const filename = req.params.filename;
    const format = req.params.format;
    const width = req.params.width;

    if (!filename || !projectId) {
        return res.sendStatus(400);
    }

    const exists = await new Promise<number>((resolve, reject) => {
        rClient.exists(`asset-${projectId}-${filename}-${format || 'default'}-${width || 'default'}`, (err, exists) => {
            if (err) return reject(err);
            resolve(exists);
        });
    });
    if (exists) {
        (<any>rClient).readStream(`asset-${projectId}-${filename}-${format || 'default'}-${width || 'default'}`).pipe(res);
        return;
    }

    const gfs = await database.gridFs();

    try {
        const readStream = gfs.createReadStream({
            filename: filename,
            root: 'assets',
            metadata: { projectId: projectId }
        });

        readStream.on('error', function(err) {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        let transform = sharp();
        if (format) {
            if (format == 'jpg') {
                transform = transform.background({ r: 255, g: 255, b: 255, alpha: 1 }).flatten(true);
            }
            transform = transform.toFormat(format);
            res.type('image/' + format);
        }

        if (width) {
            transform = transform.resize(parseInt(width));
        }

        const tStream = readStream.pipe(transform);
        tStream.pipe((<any>rClient).writeThrough(`asset-${projectId}-${filename}-${format || 'default'}-${width || 'default'}`, 86400)).pipe(res);
    } catch (error) {
        res.sendStatus(400);
    }
};
