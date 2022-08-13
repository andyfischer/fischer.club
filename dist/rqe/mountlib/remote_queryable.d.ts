import { MountPointSpec } from '../MountPoint';
import { Queryable } from '../Graph';
import { Step } from '../Step';
import { QueryModifier } from '../Query';
interface Options {
    graph: Queryable;
    queryModifier?: QueryModifier;
}
export declare function forwardToRemote(step: Step, options: Options): void;
export declare function setupRemoteQueryable(decl: string, options: Options): MountPointSpec;
export {};
