import { Response, Request, NextFunction } from 'express';
import { database } from '../services/database';
import { Collection } from 'mongodb';
import { ProjectKeys } from '../models/projectKeys';
import * as jwt from 'jsonwebtoken';

export const dynamicJWT = async function(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (<string>req.headers['authorization'] == null) {
        req.authInfo = { method: 'anonymous' };
        return next();
    }
    const token = (<string>req.headers['authorization']).replace(
        /Bearer /g,
        ''
    );

    const config = {
        audience: process.env.TOKEN_AUDIENCE,
        issuer: process.env.TOKEN_ISSUER
    };

    const rawToken: any = jwt.decode(token);
    if (!rawToken) {
        req.authInfo = { method: 'anonymous' };
        return next();
    }
    const projectId = rawToken.projectId;
    const readOnly = rawToken.readOnly;
    const method = rawToken.method;

    const db = await database.connect();
    const values = <Collection<ProjectKeys>>db.collection('projectKeys');
    const keys = await values.findOne({ projectId: projectId });

    if (!keys) {
        req.authInfo = { method: 'anonymous' };
    }

    let secret;
    if (method === 'authKey' && rawToken.readOnly) {
        secret = keys.roJwtKey;
    } else if (method === 'authKey') {
        secret = keys.jwtKey;
    } else {
        secret = keys.userJwtKey;
    }

    jwt.verify(token, secret, config, (err, verified: any) => {
        if (err) {
            console.error('JWT Error', err, err.stack);
            req.authInfo = { method: 'anonymous' };
            return next();
        } else {
            req.authInfo = {
                method: verified.method,
                role: verified.role,
                projectId: verified.projectId,
                readOnly: verified.readOnly,
                userId: verified.sub
            };
            return next();
        }
    });
};
