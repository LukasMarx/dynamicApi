import { assetService } from '../../services/assetService';
export function assets(obj: any, args: any, context: any, info: any) {
    return assetService.getAll(args.projectId);
}
export function asset(obj: any, args: any, context: any, info: any) {
    return assetService.get(args.projectId, args.name);
}

export function deleteAsset(obj: any, args: any, context: any, info: any) {
    return assetService.delete(args.projectId, args.id);
}
