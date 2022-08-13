import { MountPoint } from './MountPoint';
import { QueryTuple, QueryStepLike } from './QueryTuple';
import { Graph } from './Graph';
import { Trace } from './Trace';
interface AttrExactMatch {
    t: 'exact';
}
interface AttrPartiallyFilled {
    t: 'attr_partially_filled';
}
interface AttrOverprovided {
    t: 'attr_overprovided';
}
interface UnusedOptional {
    t: 'unused_optional';
}
export declare type AttrMatch = AttrExactMatch | AttrPartiallyFilled | AttrOverprovided | UnusedOptional;
export interface QueryMountMatch {
    attrs: Map<string, AttrMatch>;
    unusedOptionalsCount: number;
}
export interface PointMatch {
    point: MountPoint;
    match: QueryMountMatch;
}
export declare function getQueryMountMatch(trace: Trace, tuple: QueryTuple, point: MountPoint): QueryMountMatch;
export declare function getClosestWrongQueryMountMatch(trace: Trace, tuple: QueryTuple, point: MountPoint): {
    attrs: Map<any, any>;
    unusedOptionalsCount: number;
    matchProblems: any[];
};
export declare function findBestPointMatch(graph: Graph, trace: Trace, tupleLike: QueryStepLike): PointMatch | null;
export declare function findClosestWrongMatches(graph: Graph, trace: Trace, tupleLike: QueryStepLike): {
    bestMatches: any;
};
export {};
