import { schema } from './../schema/schema';
import { Type } from '../models/type';
import { Field } from '../models/field';

const typeMap: { [key: string]: string } = {
  INTEGER: 'Int',
  FLOAT: 'Float',
  DATE: 'String',
  STRING: 'String',
  BOOLEAN: 'Boolean',
  BIG_TEXT: 'String',
  ASSET: 'String'
};

export class JsonToSchemaService {
  async convert(tenantId: string, types: Type[]) {
    let schema = `input FilterInput {
        field: String!
        value: String!
    }
      `;

    for (let type of types) {
      schema += this.generateTypeString(type);
      schema += this.generateTypeInputString(type);
    }

    schema += this.generateRootQuery(types);
    schema += this.generateRootMutations(types);

    return schema;
  }

  async convertAdmin(tenantId: string, types: Type[]) {
    let schema = '';

    for (let type of types) {
      schema += this.generateTypeString(type);
      schema += this.generateTypeInputString(type);
    }

    schema += this.generateAdminQuery(types);
    schema += this.generateAdminMutations(types);

    return schema;
  }

  generateTypeString(type: Type) {
    let schema = '';
    if (type.fields) {
      schema += 'type ' + type.name + ' {\n';
      schema += 'id: String! \n';
      schema += 'public: Boolean! \n';
      for (let key in type.fields) {
        const field = type.fields[key];
        schema += field.name + ': ';
        if (typeMap[field.type]) {
          schema += typeMap[field.type];
        } else {
          schema += field.type;
        }
        // if (field.required) {
        //     schema += '!';
        // } else {
        //     schema += '?';
        // }
        schema += '\n';
      }
      schema += '}\n';
    }
    return schema;
  }

  generateTypeInputString(type: Type) {
    let schema = '';
    if (type.fields) {
      schema += 'input ' + type.name + 'Input {\n';
      schema += 'id: String\n';
      schema += 'public: Boolean\n';
      for (let key in type.fields) {
        const field = type.fields[key];
        schema += field.name + ': ';
        if (typeMap[field.type]) {
          schema += typeMap[field.type];
        } else {
          schema += field.type;
        }
        // if (field.required) {
        //     schema += '!';
        // } else {
        //     schema += '?';
        // }
        schema += '\n';
      }
      schema += '}\n';
    }
    return schema;
  }

  generateRootQuery(types) {
    let schema = 'type Query {\n';
    for (let type of types) {
      if (type.fields) {
        schema += type.name + '(filter: FilterInput!): ' + type.name + '\n';
        schema +=
          type.name +
          's(filter: [FilterInput], orderBy: String, limit: Int, skip: Int, descending: Boolean): [' +
          type.name +
          ']\n';
      }
    }
    schema += '}\n';
    return schema;
  }

  generateAdminQuery(types) {
    let schema = 'type Query {\n';
    for (let type of types) {
      if (type.fields) {
        schema += type.name + '(projectId: String!, id: String!): ' + type.name + '\n';
        schema += type.name + 's (projectId: String!): [' + type.name + ']\n';
      }
    }
    schema += '}\n';
    return schema;
  }

  generateAdminMutations(types) {
    let schema = 'type Mutation {\n';
    for (let type of types) {
      schema +=
        'create' +
        type.name +
        '(projectId: String!, input: ' +
        type.name +
        'Input): ' +
        type.name +
        '\n';
      schema +=
        'update' +
        type.name +
        '(projectId: String!, input: ' +
        type.name +
        'Input): ' +
        type.name +
        '\n';
    }
    schema += '}\n';
    return schema;
  }

  generateRootMutations(types) {
    let schema = 'type Mutation {\n';
    for (let type of types) {
      schema += 'create' + type.name + '(input: ' + type.name + 'Input): ' + type.name + '\n';
      schema += 'update' + type.name + '(input: ' + type.name + 'Input): ' + type.name + '\n';
    }
    schema += '}\n';
    return schema;
  }
}

export const jsonToSchemaService = new JsonToSchemaService();
