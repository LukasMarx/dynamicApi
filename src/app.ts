import * as express from 'express';
import * as compression from 'compression'; // compresses requests
import * as bodyParser from 'body-parser';
import * as lusca from 'lusca';

import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import * as passport from 'passport';
import * as logger from 'morgan';
import * as expressValidator from 'express-validator';
import * as cors from 'cors';

import * as adminApi from './controllers/admin';
import * as privateApi from './controllers/private';
import * as publicApi from './controllers/public';
import * as auth from './controllers/auth';
import * as healthz from './controllers/healthz';
import { Strategy } from './passport/jwtStrategy';
import { postAsset, getAsset } from './controllers/asset';
import { getToken } from './controllers/userAuth';

// Create Express server
export const app = express();

app.disable('x-powered-by');

// Express configuration
app.set('port', process.env.PORT || 8000);
app.use(compression());
app.use(bodyParser.json({ limit: '200kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
passport.use(Strategy);
app.use(passport.initialize());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/api/v1/admin/api', passport.authenticate('jwt', { session: false }), adminApi.getAdmin);
app.post('/api/v1/admin/api', passport.authenticate('jwt', { session: false }), adminApi.postAdmin);
app.post('/api/v1/auth/token', auth.adminToken);

app.get('/api/v1/admin/content', privateApi.getContent);
app.post('/api/v1/admin/content', privateApi.postContent);

app.get('/healthz', healthz.healthz);

app.get('/api/v1/:projectId/asset/:filename/:format/:width', getAsset);
app.get('/api/v1/:projectId/asset/:filename/:format', getAsset);
app.get('/api/v1/:projectId/asset/:filename', getAsset);
app.post('/api/v1/:projectId/asset', postAsset);

app.post('/api/v1/:projectId/auth/:provider', getToken);

app.use('/api/v1/', publicApi.publicApi);
