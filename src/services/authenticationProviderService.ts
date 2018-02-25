import { AuthenticationProvider } from '../models/authenticationProvider';
import { database } from './database';
import { Collection } from 'mongodb';
import { authenticationProvider } from '../schema/resolvers/authenticationProvider';

export class AuthenticationProviderService {
    public async getAllAuthenticationProviders(projectId: string) {
        const db = await database.connect();
        const authenticationProviders = <Collection<
            AuthenticationProvider
        >>db.collection('authenticationProvider');

        return authenticationProviders.find({ projectId: projectId }).toArray();
    }

    public async getAuthenticationProvider(projectId: string, id: string) {
        const db = await database.connect();
        const authenticationProviders = <Collection<
            AuthenticationProvider
        >>db.collection('authenticationProvider');

        return authenticationProviders.findOne({
            projectId: projectId,
            id: id
        });
    }

    public async createAuthenticationProvider(
        projectId: string,
        authenticationProvider: AuthenticationProvider
    ) {
        const db = await database.connect();
        const authenticationProviders = <Collection<
            AuthenticationProvider
        >>db.collection('authenticationProvider');

        authenticationProvider.id = authenticationProvider.name.toLowerCase();
        authenticationProvider.projectId = projectId;

        return authenticationProviders.insertOne(authenticationProvider);
    }

    public async updateAuthenticationProvider(
        id: string,
        projectId: string,
        authenticationProvider: AuthenticationProvider
    ) {
        const db = await database.connect();
        const authenticationProviders = <Collection<
            AuthenticationProvider
        >>db.collection('authenticationProvider');

        return authenticationProviders.updateOne(
            { projectId: projectId, id: id },
            { $set: authenticationProvider }
        );
    }

    public async deleteAuthenticationProvider(projectId: string, id: string) {
        const db = await database.connect();
        const authenticationProviders = <Collection<
            AuthenticationProvider
        >>db.collection('authenticationProvider');

        return authenticationProviders.deleteOne({
            projectId: projectId,
            id: id
        });
    }
}
export const authenticationProviderService = new AuthenticationProviderService();
