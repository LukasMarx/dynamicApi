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
        let schema = `
    
    interface Node {
        id: ID!
    }
    
    input FilterInput {
        field: String!
        value: String!
    }

    input ExternalInput {
        id: String!
    }

    input Assignment {
        parent:String!
        child: String!
    }
    type PageInfo{
        endCursor: String!
        hasNextPage: Boolean!
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
        let schema = `
        input ExternalInput {
            id: String!
        }
        input Assignment {
            parent:String!
            child: String!
        }
        input FilterInput {
            field: String!
            value: String!
        }

        type PageInfo{
            startCursor: String!
            endCursor: String!
            hasNextPage: Boolean!
        }
        `;

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
        const customTypeFields = this.getAllCustomTypedFields(type);

        schema += this.generateEdgeType(type.name);
        schema += this.generateConnectionType(type.name);

        if (type.fields) {
            schema += 'type ' + type.name + ' {\n';
            schema += 'id: String! \n';
            schema += 'public: Boolean! \n';
            for (let key in type.fields) {
                if (key === 'id' || key === 'public') {
                    continue;
                }
                const field = type.fields[key];

                schema += field.name + '(filter: [FilterInput], orderBy: String, limit: Int, skip: Int, descending: Boolean, after: String): ';
                if (this.isFieldOfNativeType(field)) {
                    schema += typeMap[field.type];
                } else if (field.list) {
                    schema += `${field.type}Connection`;
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

    generateEdgeType(targetTypeName: string) {
        return `
        type ${targetTypeName}Edge {
            cursor: String!
            node: ${targetTypeName}
        }
    `;
    }

    generateConnectionType(targetTypeName: string) {
        return `
            type ${targetTypeName}Connection {
                nodes: [${targetTypeName}]
                edges: [${targetTypeName}Edge]
                totalCount: Int
                pageInfo: PageInfo
            }
        `;
    }

    generateTypeInputString(type: Type) {
        let schema = '';

        if (type.fields) {
            schema += 'input ' + type.name + 'Input {\n';
            schema += 'id: String\n';
            schema += 'public: Boolean\n';
            for (let key in type.fields) {
                if (key === 'id' || key === 'public') {
                    continue;
                }
                const field = type.fields[key];

                if (typeMap[field.type]) {
                    schema += field.name + ': ';
                    schema += typeMap[field.type];
                } else {
                    schema += field.name + ': ExternalInput';
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
                schema += type.name + '(filter: [FilterInput]!): ' + type.name + '\n';
                schema += type.name + 's(filter: [FilterInput], orderBy: String, limit: Int, skip: Int, descending: Boolean): ' + type.name + 'Connection\n';
            }
        }
        schema += '}\n';
        return schema;
    }

    generateAdminQuery(types) {
        let schema = 'type Query {\n';
        for (let type of types) {
            if (type.fields) {
                schema += type.name + '(projectId: String!,filter: [FilterInput]!): ' + type.name + '\n';
                schema +=
                    type.name +
                    's (projectId: String!, filter: [FilterInput], orderBy: String, limit: Int, skip: Int, descending: Boolean): ' +
                    type.name +
                    'Connection' +
                    '\n';
            }
        }
        schema += '}\n';
        return schema;
    }

    generateAdminMutations(types: Type[]) {
        let schema = 'type Mutation {\n';
        for (let type of types) {
            schema += 'create' + type.name + '(projectId: String!, input: ' + type.name + 'Input): ' + type.name + '\n';
            schema += 'update' + type.name + '(projectId: String!, input: ' + type.name + 'Input): ' + type.name + '\n';
            this.getAllCustomTypedFields(type).forEach(field => {
                schema += 'assign' + field.name + 'To' + type.name + '(projectId: String!, assignments: [Assignment]): ' + type.name + '\n';
                schema += 'deassign' + field.name + 'From' + type.name + '(projectId: String!, assignments: [Assignment]): ' + type.name + '\n';
            });
        }
        schema += '}\n';
        return schema;
    }

    generateRootMutations(types) {
        let schema = 'type Mutation {\n';
        for (let type of types) {
            schema += 'create' + type.name + '(input: ' + type.name + 'Input): ' + type.name + '\n';
            schema += 'update' + type.name + '(input: ' + type.name + 'Input): ' + type.name + '\n';
            this.getAllCustomTypedFields(type).forEach(field => {
                schema += 'assign' + field.name + 'To' + type.name + '(assignments: [Assignment]): ' + type.name + '\n';
                schema += 'deassign' + field.name + 'From' + type.name + '(assignments: [Assignment]): ' + type.name + '\n';
            });
        }
        schema += '}\n';
        return schema;
    }

    private isFieldOfNativeType(field: Field): boolean {
        if (typeMap[field.type]) {
            return true;
        }
        return false;
    }

    public getAllCustomTypedFields(type: Type): Field[] {
        const result = [];
        let field: Field;
        for (let key in type.fields) {
            field = type.fields[key];
            if (!this.isFieldOfNativeType(field)) {
                result.push(field);
            }
        }
        return result;
    }
}

export const jsonToSchemaService = new JsonToSchemaService();
