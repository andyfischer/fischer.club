import { Table } from '../Table';
import { Graph } from '../Graph';
import { MountPointSpec } from '../MountPoint';
import { QueryModifier } from '../Query';
interface Options {
    table?: Table;
    graph?: Graph;
    queryModifier?: QueryModifier;
}
export declare function setupCacher(decl: string, options: Options): MountPointSpec;
export {};
