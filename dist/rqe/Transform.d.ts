import { Item } from './Item';
import { Graph } from './Graph';
import { Stream } from './Stream';
import { Query, QueryLike } from './Query';
export declare type TransformFunc = (input: Item, args: any) => Item[];
export interface TransformDef {
    func: TransformFunc;
}
export declare type LooseTransformQuery = TransformQuery | LooseTransformStep[];
export declare type LooseTransformStep = VerbTransformStep | Function;
export declare type TransformStep = VerbTransformStep;
export interface VerbTransformStep {
    verb: 'rename' | 'where';
    [key: string]: any;
}
export declare type TransformQuery = {
    t: 'transform';
    steps: TransformStep[];
};
export declare function toTransformQuery(graph: Graph | null, looseQuery: TransformQuery | LooseTransformQuery): TransformQuery;
export declare function applyTransform(graph: Graph, items: Item[], query: Query): Stream;
export declare function applyTransformationToGraph(graph: Graph, transformLike: QueryLike): void;
