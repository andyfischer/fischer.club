import { Table } from './Table';
import { Item } from './Item';
export interface IndexConfiguration {
    attrs: string[];
    unique?: boolean | UniqueConstraintConfig;
}
export declare type LooseIndexConfig = string | IndexConfiguration;
export declare type IndexConfig = IndexConfiguration;
export interface Reference {
    attr: string;
    table?: Table;
    foreignAttr?: string;
    onDelete: OnDeleteOption;
}
export interface UniqueConstraintConfig {
    onConflict: OnConflictOption;
}
export declare type OnConflictOption = 'overwrite' | 'error' | 'drop_new';
export declare type OnDeleteOption = 'cascade' | 'set_null';
export declare type AttrGenerationMethod = 'increment' | 'random' | 'time_put';
export interface LooseAttrConfig {
    index?: boolean;
    required?: boolean;
    type?: string;
    reference?: {
        onDelete: OnDeleteOption;
    };
    foreignKey?: {
        table: Table;
        foreignAttr: string;
        onDelete?: OnDeleteOption;
    };
    unique?: boolean | UniqueConstraintConfig;
    generate?: boolean | {
        prefix?: string;
        length?: number;
        method: AttrGenerationMethod;
    };
}
export interface AttrConfig {
    index?: boolean;
    required?: boolean;
    type?: string;
    reference?: {
        onDelete: OnDeleteOption;
    };
    foreignKey?: {
        table: Table;
        foreignAttr: string;
        onDelete?: OnDeleteOption;
    };
    unique?: UniqueConstraintConfig;
    generate?: {
        prefix?: string;
        length?: number;
        method: AttrGenerationMethod;
    };
}
export declare type MountSpec = true | NamespaceMount;
export interface NamespaceMount {
    namespace: string;
}
export interface TableSchema {
    name?: string;
    attrs?: {
        [attr: string]: AttrConfig;
    };
    indexes?: IndexConfig[];
    references?: Reference[];
    foreignKeys?: Reference[];
    initialItems?: Item[];
    hint?: 'inmemory';
    mount?: MountSpec;
    funcs?: string[];
}
export interface LooseTableSchema {
    name?: string;
    attrs?: string | {
        [attr: string]: LooseAttrConfig;
    };
    indexes?: LooseIndexConfig[];
    references?: Reference[];
    foreignKeys?: Reference[];
    initialItems?: Item[];
    hint?: 'inmemory';
    mount?: MountSpec;
    funcs?: string[];
}
export declare function findUniqueAttr(schema: TableSchema): [string, AttrConfig] | [];
export declare function parseLooseStringList(list: string | string[]): string[];
export declare function fixLooseSchema(schema: LooseTableSchema): TableSchema;
