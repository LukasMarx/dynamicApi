import { Field, Visibility } from '../models/field';

export function isFieldVisible(field: Field, authMethod: string): Boolean {
    if (!field || !authMethod) return false;
    switch (authMethod) {
        case 'anonymous': {
            if (field.visibility == Visibility.ANYONE) return true;
            return false;
        }
        case 'authKey': {
            if (field.visibility == Visibility.ANYONE || field.visibility == Visibility.AUTHKEY) return true;
            return false;
        }
        case 'user': {
            if (field.visibility == Visibility.ANYONE || field.visibility == Visibility.AUTHKEY || field.visibility == Visibility.USER) return true;
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
