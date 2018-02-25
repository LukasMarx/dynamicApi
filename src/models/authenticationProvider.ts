import { Type } from './type';

export enum CloudAuthenticationProvider {
    GOOGLE,
    TWITTER,
    FACEBOOK,
    GITHUB
}

export class AuthenticationProvider {
    public id: string;
    public name: string;
    public cloudProvider: CloudAuthenticationProvider;
    public targetType: string;
    public mappings: {
        userId: string;
        name: string;
        pictureUrl: string;
        cloudProvider: string;
    }[];

    public clientId: string;
    public projectId: string;
}
