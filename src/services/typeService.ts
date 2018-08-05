import { TypeInput } from './../models/type';
import { Type } from '../models/type';
import * as _ from 'lodash';
import { database } from './database';
import { Collection } from 'mongodb';
import { typeCache } from '../cache/type';

const cache = typeCache;

export class TypeService {
  async getAllTypes(projectId: string): Promise<Type[]> {
    const cacheResult = <Type[]>cache.get(projectId);
    if (cacheResult) {
      return cacheResult;
    }

    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    const cursor = types.find({ projectId: projectId });
    const result = await cursor.toArray();
    if (result.length > 0) cache.set(projectId, result);
    return result;
  }

  async getType(projectId: string, name: string): Promise<Type> {
    const cacheResult = <Type>cache.get(projectId + '_' + name);
    if (cacheResult) {
      return cacheResult;
    }

    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    const result = await types.findOne({ projectId: projectId, name: name });
    if (result) cache.set(projectId + '_' + name, result);
    return result;
  }

  async addType(projectId: string, type: TypeInput): Promise<TypeInput> {
    type.projectId = projectId;

    const copy: any = _.cloneDeep(type);
    copy.fields = {};
    if (type.fields) {
      type.fields.forEach(field => {
        copy.fields[field.name] = field;
      });
    }
    copy.permissions = {};
    if (type.permissions) {
      type.permissions.forEach(crud => {
        copy.permissions[crud.role] = crud;
      });
    }

    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    const result = await types.insertOne(copy);
    cache.del(projectId);
    return type;
  }

  async updateType(projectId: string, name: string, type: TypeInput) {
    type.projectId = projectId;
    type.name = name;

    const copy: any = _.cloneDeep(type);
    copy.fields = {};
    if (type.fields) {
      type.fields.forEach(field => {
        copy.fields[field.name] = field;
      });
    }
    copy.permissions = {};
    if (type.permissions) {
      type.permissions.forEach(crud => {
        copy.permissions[crud.role] = crud;
      });
    }

    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    await types.updateOne({ projectId: projectId, name: name }, { $set: copy });
    cache.del(projectId);
    cache.del(projectId + '_' + name);
    return type;
  }

  async removeType(projectId: string, name: string): Promise<string> {
    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    await types.deleteOne({ projectId: projectId, name: name });
    cache.del(projectId);
    cache.del(projectId + '_' + name);
    return name;
  }
}

export const dynamicSchemaService = new TypeService();
