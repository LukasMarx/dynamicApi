import { authKeyService } from '../../services/authKeyService';
export function authKey(obj: any, args: any, context: any, info: any) {
    return authKeyService.getKey(args.projectId);
}
