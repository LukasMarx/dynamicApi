import { Field } from './field';

export interface CRUDPermission {
  role: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  readAll?: boolean;
}

export interface Type {
  projectId: string;
  name: string;
  fields: { [key: string]: Field };
  permissions: {
    [key: string]: CRUDPermission;
  };
}

export interface TypeInput {
  projectId: string;
  name: string;
  fields: Field[];
  permissions: CRUDPermission[];
}
