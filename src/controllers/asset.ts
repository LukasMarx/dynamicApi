import { Response, Request, NextFunction } from 'express';
import { IncomingForm } from 'formidable';
import { database } from '../services/database';
import { Collection } from 'mongodb';
import { Asset } from '../models/asset';
import * as fs from 'fs';

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
        // const asset = new Asset();
        // asset.fileName = file.name;
        // asset.projectId = projectId;
        // asset.size = file.size;
        // asset.type = file.type;
        // assets.insert(asset);
    });
    form.on('end', () => {
        res.sendStatus(200);
    });
    form.parse(req);
};

export const getAsset = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const filename = req.params.filename;
    const gfs = await database.gridFs();

    const readStream = gfs.createReadStream({
        filename: filename,
        metadata: { projectId: projectId }
    });
    res.send(readStream);
};
