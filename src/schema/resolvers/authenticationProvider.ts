import { authenticationProviderService } from '../../services/authenticationProviderService';

export function authenticationProvider(
    obj: any,
    args: any,
    context: any,
    info: any
) {
    return authenticationProviderService.getAuthenticationProvider(
        args.projectId,
        args.id
    );
}

export function authenticationProviders(
    obj: any,
    args: any,
    context: any,
    info: any
) {
    return authenticationProviderService.getAllAuthenticationProviders(
        args.projectId
    );
}

export function createAuthenticationProvider(
    obj: any,
    args: any,
    context: any,
    info: any
) {
    return authenticationProviderService.createAuthenticationProvider(
        args.projectId,
        args.authProvider
    );
}

export function updateAuthenticationProvider(
    obj: any,
    args: any,
    context: any,
    info: any
) {
    return authenticationProviderService.updateAuthenticationProvider(
        args.projectId,
        args.id,
        args.authProvider
    );
}

export function deleteAuthenticationProvider(
    obj: any,
    args: any,
    context: any,
    info: any
) {
    return authenticationProviderService.deleteAuthenticationProvider(
        args.projectId,
        args.id
    );
}
