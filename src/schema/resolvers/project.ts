import { projectService } from '../../services/projectService';
export function project(obj: any, args: any, context: any, info: any) {
    return projectService.getProject(args.id, args.name).catch();
}
export function projects(obj: any, args: any, context: any, info: any) {
    return projectService.getAllProjects(context.user.id);
}

export function createProject(obj: any, args: any, context: any, info: any) {
    return projectService.addProject(context.user.id, args.input);
}
