import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import { database } from '../services/database';

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: process.env.JWT_SECRET };

export const Strategy = new JwtStrategy(jwtOptions, async function(jwt_payload, next) {
    next(null, { id: jwt_payload.sub });
});
