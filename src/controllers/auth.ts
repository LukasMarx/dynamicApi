import { Response, Request, NextFunction } from 'express';
import { database } from '../services/database';
import { Account } from './../models/account';
import { Collection } from 'mongodb';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export const adminToken = async (req: Request, res: Response) => {
    const body = req.body;
    try {
        if (!body.email || !body.password) return res.sendStatus(400);

        const db = await database.connect();
        const values = <Collection<Account>>db.collection('accounts');
        const account = await values.findOne({ email: body.email });
        if (!account) return res.sendStatus(400);

        if (await bcrypt.compare(body.password, account.password)) {
            const token = {};
            const signedToken = jwt.sign(token, process.env['JWT_SECRET'], {
                audience: process.env.TOKEN_AUDIENCE,
                issuer: process.env.TOKEN_ISSUER,
                subject: body.email,
                expiresIn: '24h'
            });
            return res.json({ token: signedToken });
        }
    } catch (error) {
        console.error(error);
    }
    return res.sendStatus(400);
};
