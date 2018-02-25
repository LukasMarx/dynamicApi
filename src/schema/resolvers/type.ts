import { dynamicSchemaService } from '../../services/typeService';

export async function type(obj: any, args: any, context: any, info: any) {
    const res = await dynamicSchemaService
        .getType(args.projectId, args.name)
        .catch();
    if (res.fields) {
        let array = [];
        for (let key in res.fields) {
            array.push(res.fields[key]);
        }
        (<any>res).fields = array;
    } else {
        (<any>res).fields = [];
    }

    if (res.permissions) {
        let array = [];
        for (let key in res.permissions) {
            array.push(res.permissions[key]);
        }
        (<any>res).permissions = array;
    } else {
        (<any>res).permissions = [];
    }
    return res;
}

export async function types(obj: any, args: any, context: any, info: any) {
    const res = await dynamicSchemaService.getAllTypes(args.projectId).catch();
    res.forEach(type => {
        if (type.fields) {
            let array = [];
            for (let key in type.fields) {
                array.push(type.fields[key]);
            }
            (<any>type).fields = array;
        } else {
            (<any>type).fields = [];
        }
        if (type.permissions) {
            let array = [];
            for (let key in type.permissions) {
                array.push(type.permissions[key]);
            }
            (<any>type).permissions = array;
        } else {
            (<any>type).permissions = [];
        }
    });

    return res;
}

export function createType(obj: any, args: any, context: any, info: any) {
    return dynamicSchemaService.addType(args.projectId, args.type).catch();
}
export function updateType(obj: any, args: any, context: any, info: any) {
    return dynamicSchemaService.updateType(
        args.projectId,
        args.name,
        args.type
    );
}
export function removeType(obj: any, args: any, context: any, info: any) {
    return dynamicSchemaService.removeType(args.projectId, args.name);
}
