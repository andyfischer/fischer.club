import { HandlerCallback } from './Setup';
import { Module } from './Module';
import { TaggedValue } from './TaggedValue';
import { Graph } from './Graph';
export interface MountAttr {
    required?: boolean;
    requiresValue?: boolean;
    specificValue?: TaggedValue;
    assumeInclude?: boolean;
}
export interface MountPointRef {
    moduleId: string;
    pointId: number;
}
export interface MountPointSpec {
    t?: 'mountPointSpec';
    name?: string;
    attrs: {
        [attr: string]: MountAttr;
    };
    run?: HandlerCallback;
    localId?: number;
    providerId?: string;
}
export declare type LooseMountPointSpec = MountPointSpec | string;
export interface MountSpec {
    points: MountPointSpec[];
}
export declare class MountPoint {
    name: string;
    localId: number;
    providerId?: string;
    spec: MountPointSpec;
    attrs: {
        [attr: string]: MountAttr;
    };
    requiredAttrCount: number;
    module: Module;
    callback?: HandlerCallback;
    addedAttributeTables: Map<string, MountPoint>;
    constructor(graph: Graph, spec: MountPointSpec, module?: Module);
    getRef(): MountPointRef;
    has(attr: string): boolean;
    getAddedAttribute(attr: string): MountPoint;
    put(): MountPoint;
    delete(): MountPoint;
    toDeclString(): string;
}
export declare function mountSpecPlusAttr(spec: MountPointSpec, addedAttr: string): MountPointSpec;
export declare function mountAttrToString(attr: string, details: MountAttr): string;
export declare function pointSpecToDeclString(spec: MountPointSpec): string;
export declare function resolveLooseMountPointSpec(looseSpec: LooseMountPointSpec): MountPointSpec;
