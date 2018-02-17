import { TypeInput } from './../models/type';
import { Type } from '../models/type';
import * as _ from 'lodash';
import { database } from './database';
import { Collection } from 'mongodb';

export class DynamicSchemaService {
  async getAllTypes(projectId: string): Promise<Type[]> {
    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    const result = types.find({ projectId: projectId });
    return await result.toArray();
  }

  async getType(projectId: string, name: string): Promise<Type> {
    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    return await types.findOne({ projectId: projectId, name: name });
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

    await types.updateOne({ projectId: projectId, name: name }, copy);
    return type;
  }

  async removeType(projectId: string, name: string): Promise<string> {
    const db = await database.connect();
    const types = <Collection<Type>>db.collection('types');

    await types.deleteOne({ projectId: projectId, name: name });
    return name;
  }
}

export const dynamicSchemaService = new DynamicSchemaService();
