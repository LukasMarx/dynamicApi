import { Type } from '../models/type';
import { v4 } from 'uuid';
import { database } from './database';
import { Collection } from 'mongodb';
import { Field, Visibility } from '../models/field';

export class ContentService {
    async insert(
        projectId: string,
        type: Type,
        value: any,
        authMethod: string,
        userId: string
    ) {
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                throw new Error("You don't have access to the field " + key);
            }
        }

        const generatedEntity = this.generateEntity(
            projectId,
            type,
            value,
            userId
        );

        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        await values.insert(generatedEntity);

        return value;
    }

    async get(
        projectId: string,
        type: Type,
        filter: any,
        isPublic: boolean = true,
        authMethod: string,
        userId: string
    ) {
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const params: any = { projectId: projectId, type: type.name };
        if (isPublic) {
            params.public = true;
        }

        if (filter.filter) {
            for (let input of filter.filter) {
                params[input.field] = input.value;
            }
        }

        const excluded = {};
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                excluded[key] = 0;
            }
        }

        const entities = await values
            .find(params, excluded)
            .project(excluded)
            .toArray();

        if (entities.length > 0) {
            const entity = entities[0];
            for (let key in type.fields) {
                if (
                    type.fields[key].visibility == Visibility.OWNER &&
                    entity._owner !== userId
                ) {
                    entity[key] = null;
                }
            }
            return entity;
        }
        return null;
    }

    async update(
        projectId: string,
        type: Type,
        id: string,
        value: any,
        authMethod: string
    ) {
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                throw new Error("You don't have access to the field " + key);
            }
        }

        const generatedEntity = this.generateEntity(
            projectId,
            type,
            value,
            null
        );

        value.type = type.name;
        value.projectId = projectId;
        value.id = id;
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        values.updateOne(
            { projectId: projectId, id: id, type: type.name },
            { $set: value }
        );

        return value;
    }

    async getAll(
        projectId: string,
        type: Type,
        filter: {
            filter?: any[];
            orderBy?: string;
            descending?: boolean;
            limit?: number;
            skip?: number;
            fields?: string[];
        },
        isPublic: boolean = true,
        authMethod: string,
        userId: string
    ) {
        const db = await database.connect();
        const values = <Collection<any>>db.collection('values');
        const params: any = {};
        if (filter.filter) {
            for (let input of filter.filter) {
                params[input.field] = input.value;
            }
        }
        params.projectId = projectId;
        params.type = type.name;
        if (isPublic) {
            params.public = true;
        }

        const excluded = {};
        for (let key in type.fields) {
            if (!isFieldVisible(type.fields[key], authMethod)) {
                excluded[key] = 0;
            }
        }

        const result = await values
            .find(params)
            .sort(filter.orderBy || '_id', filter.descending ? -1 : 1)
            .skip(filter.skip || 0)
            .limit(filter.limit || 0)
            .project(excluded)
            .toArray();

        if (result.length > 0) {
            result.forEach(entity => {
                for (let key in type.fields) {
                    if (
                        type.fields[key].visibility == Visibility.OWNER &&
                        entity._owner !== userId
                    ) {
                        entity[key] = null;
                    }
                }
            });
        }

        return result;
    }

    getExternFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
            if (field.type === 'BIG_TEXT') result.push(field);
        }
        return result;
    }

    getFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
            result.push(field);
        }
        return result;
    }

    getUniqueFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
            if (field.unique) result.push(field);
        }
        return result;
    }

    getInternFields(type: Type) {
        const result = [];
        for (let key in type.fields) {
            let field = type.fields[key];
        }
        return result;
    }

    private generateEntity(
        projectId: string,
        type: Type,
        value: any,
        userId: string
    ) {
        const generatedEntity: any = {};

        generatedEntity.type = type.name;
        generatedEntity.projectId = projectId;
        generatedEntity.id = v4();
        if (userId) {
            generatedEntity._owner = userId;
        }

        for (let key in type.fields) {
            let field = type.fields[key];
            if (!value[field.name]) continue;

            switch (field.type) {
                case 'STRING': {
                    if (typeof field.name === 'string')
                        generatedEntity[field.name] = value[field.name];
                    break;
                }
                case 'INTEGER': {
                    if (!isNaN(value[field.name])) {
                        generatedEntity[field.name] = Math.floor(
                            value[field.name]
                        );
                    }
                    break;
                }
                case 'FLOAT': {
                    if (!isNaN(value[field.name])) {
                        generatedEntity[field.name] = value[field.name];
                    }
                    break;
                }
                case 'BINARY': {
                    generatedEntity[field.name] = value[field.name];
                }
                case 'BIG_TEXT': {
                }
                case 'BIG_BINARY': {
                }
                case 'ASSET': {
                    generatedEntity[field.name] = value[field.name];
                }
                case 'DATE': {
                    generatedEntity[field.name] = value[field.name];
                }
            }
        }
        return generatedEntity;
    }
}

function isFieldVisible(field: Field, authMethod: string): Boolean {
    if (!field || !authMethod) return false;
    switch (authMethod) {
        case 'anonymous': {
            if (field.visibility == Visibility.ANYONE) return true;
            return false;
        }
        case 'authKey': {
            if (
                field.visibility == Visibility.ANYONE ||
                field.visibility == Visibility.AUTHKEY
            )
                return true;
            return false;
        }
        case 'user': {
            if (
                field.visibility == Visibility.ANYONE ||
                field.visibility == Visibility.AUTHKEY ||
                field.visibility == Visibility.USER
            )
                return true;
            return false;
        }
        case 'owner': {
            if (
                field.visibility == Visibility.ANYONE ||
                field.visibility == Visibility.AUTHKEY ||
                field.visibility == Visibility.USER ||
                field.visibility == Visibility.OWNER
            )
                return true;
            return false;
        }
        case 'admin': {
            return true;
        }
        default: {
            return false;
        }
    }
}

export const contentService = new ContentService();
