import { Type } from '../models/type';
import { v4 } from 'uuid';
import { database } from './database';
import { Collection } from 'mongodb';

export class ContentService {
  async insert(projectId: string, type: Type, value: any) {
    const generatedEntity = this.generateEntity(projectId, type, value);

    const db = await database.connect();
    const values = <Collection<any>>db.collection('values');
    await values.insert(generatedEntity);

    return value;
  }

  async get(projectId: string, type: Type, filter: any, isPublic: boolean = true) {
    // if (!fields) fields = [];
    // if (fields) fields = fields.filter(f => f !== '_typename');

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
    const entity = await values.findOne(params);

    return entity;
  }

  async update(projectId: string, type: Type, id: string, value: any) {
    const generatedEntity = this.generateEntity(projectId, type, value);

    value.type = type.name;
    value.projectId = projectId;
    value.id = id;
    const db = await database.connect();
    const values = <Collection<any>>db.collection('values');
    values.updateOne({ projectId: projectId, id: id, type: type.name }, value);

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
    isPublic: boolean = true
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
    const result = await values
      .find(params)
      .sort(filter.orderBy || '_id', filter.descending ? -1 : 1)
      .skip(filter.skip || 0)
      .limit(filter.limit || 0)
      .toArray();
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

  private generateEntity(projectId: string, type: Type, value: any) {
    const generatedEntity: any = {};

    generatedEntity.type = type.name;
    generatedEntity.projectId = projectId;
    generatedEntity.id = v4();

    for (let key in type.fields) {
      let field = type.fields[key];
      if (!value[field.name]) continue;

      switch (field.type) {
        case 'STRING': {
          if (typeof field.name === 'string') generatedEntity[field.name] = value[field.name];
          break;
        }
        case 'INTEGER': {
          if (!isNaN(value[field.name])) {
            generatedEntity[field.name] = Math.floor(value[field.name]);
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

export const contentService = new ContentService();
