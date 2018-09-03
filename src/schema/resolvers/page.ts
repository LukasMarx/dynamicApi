import { pageService } from "../../services/pageService";

export function pages(obj: any, args: any, context: any, info: any) {
    return pageService.getAllPages(args.projectId, args.type);
}

export function createPage(obj: any, args: any, context: any, info: any) {
    return pageService.createPage(args.projectId, args.type, args.page);
}

export function updatePage(obj: any, args: any, context: any, info: any) {
    return pageService.updatePage(args.projectId, args.id, args.page);
}
