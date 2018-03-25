export enum Visibility {
    ANYONE,
    AUTHKEY,
    USER,
    OWNER,
    ADMIN
}

export interface Field {
    name: string;

    type: string;

    displayGroup: string;

    fullPage: boolean;

    visibility: Visibility;

    unique: boolean;

    list: boolean;
}
