import * as jwt from 'jsonwebtoken';
import { database } from './database';
import { Collection } from 'mongodb';
import { ProjectKeys } from '../models/projectKeys';

export class AuthKeyService {
  async getKey(projectId: string) {
    const db = await database.connect();
    const projectKeys = <Collection<ProjectKeys>>db.collection('projectKeys');

    const result = await projectKeys.findOne({ projectId: projectId });

    if (result) {
      const token = {
        method: 'authKey',
        readOnly: false,
        projectId: projectId
      };

      const signedToken = jwt.sign(token, result.jwtKey, {
        audience: projectId,
        issuer: projectId
      });

      return signedToken;
    }
  }

  async getReadOnlyKey(projectId: string) {
    const db = await database.connect();
    const projectKeys = <Collection<ProjectKeys>>db.collection('projectKeys');

    const result = await projectKeys.findOne({ projectId: projectId });

    if (result && result) {
      const token = {
        method: 'authKey',
        readOnly: true,
        projectId: projectId
      };

      const signedToken = jwt.sign(token, result.roJwtKey, {
        audience: projectId,
        issuer: projectId
      });
    }
  }
}

export const authKeyService = new AuthKeyService();
