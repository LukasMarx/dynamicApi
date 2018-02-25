import { Response, Request, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { authenticationProviderService } from '../services/authenticationProviderService';
import { contentService } from '../services/contentService';
import { dynamicSchemaService } from '../services/typeService';
import { database } from '../services/database';
import { Collection } from 'mongodb';
import * as jwt from 'jsonwebtoken';
import { authKeyService } from '../services/authKeyService';
import { ProjectKeys } from '../models/projectKeys';

export const getToken = async (req: Request, res: Response) => {
    try {
        const providerId = req.params.provider;
        const token = req.body.token;
        const projectId = req.params.projectId;

        if (!providerId || !token || !projectId) {
            return res.sendStatus(400);
        }

        const provider = await authenticationProviderService.getAuthenticationProvider(
            projectId,
            providerId
        );

        const validationResult = await validateWithProvider(
            provider.cloudProvider.toString(),
            provider.clientId,
            token
        );

        const targetType = await dynamicSchemaService.getType(
            projectId,
            provider.targetType
        );

        const mappings = provider.mappings[0];
        let filter = { projectId: projectId, type: targetType.name };
        filter[mappings.userId] = validationResult.userId;
        filter[mappings.cloudProvider] = validationResult.cloudProvider;
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        let user = await values.findOne(filter);

        let result = {};
        result[mappings.userId] = validationResult.userId;
        result[mappings.name] = validationResult.name;
        result[mappings.pictureUrl] = validationResult.pictureUrl;
        result[mappings.cloudProvider] = validationResult.cloudProvider;

        if (!user) {
            await contentService.insert(
                projectId,
                targetType,
                result,
                'admin',
                validationResult.userId
            );
        }

        result['projectId'] = projectId;
        result['type'] = provider.targetType;

        const jwtToken = await generateToken(projectId, result);
        res.json({ token: jwtToken });
    } catch (error) {
        res.sendStatus(400);
    }
};

async function validateWithProvider(
    cloudProvider: string,
    clientId: string,
    token: any
) {
    switch (cloudProvider) {
        case 'GOOGLE': {
            return validateWithGoogle(clientId, token);
        }
    }
}

async function validateWithGoogle(clientId: string, token: any) {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId
    });
    const payload = ticket.getPayload();
    const userId = payload['sub'];
    const name = payload['name'];
    const pictureUrl = payload['picture'];

    return {
        userId: userId,
        name: name,
        pictureUrl: pictureUrl,
        cloudProvider: 'GOOGLE'
    };
}

async function generateToken(projectId: string, user: any) {
    const db = await database.connect();
    const projectKeys = <Collection<ProjectKeys>>db.collection('projectKeys');

    const result = await projectKeys.findOne({ projectId: projectId });
    return jwt.sign(user, result.userJwtKey);
}
