import { Graph } from './Graph';
import { QueryTuple, QueryStepLike, LooseQueryVerbStep, QueryTupleAsObject } from './QueryTuple';
import { Stream } from './Stream';
export declare type QueryLike = string | Query | QueryAsObject | LoosePipedQuery | QueryStepLike | QueryStepLike[] | QueryTuple | QueryTupleAsObject;
export interface QueryParameters {
    '$input'?: Stream;
    [name: string]: any;
}
export interface LoosePipedQuery {
    steps: LooseQueryVerbStep[];
}
interface QueryPrepareContext {
    graph?: Graph;
    expectTransform?: boolean;
}
export interface QueryAsObject {
    t: 'queryObject';
    isTransform: boolean;
    steps: QueryTupleAsObject[];
}
export interface QueryModifier {
    with?: string | string[];
    without?: string | string[];
}
export declare function toQuery(queryLike: QueryLike, ctx?: QueryPrepareContext): Query;
export declare function queryLikeToString(queryLike: QueryLike): string;
export declare function queryLikeToSerializable(queryLike: QueryLike): string;
interface QueryConstructorOptions {
    isTransform?: boolean;
}
export declare class Query {
    t: 'query';
    isTransform: boolean;
    steps: QueryTuple[];
    constructor(steps: QueryTuple[], opts?: QueryConstructorOptions);
    first(): QueryTuple;
    injectParameters(parameters: QueryParameters): Query;
    toQueryString(): string;
    remapTuples(callback: (tuple: QueryTuple) => QueryTuple): Query;
    convertToPut(): Query;
    equals(rhs: Query): boolean;
    toObject(): QueryAsObject;
    checkFilledParameters(params: QueryParameters): void;
    static fromObject(object: QueryAsObject): Query;
    maybeTestObjectSerialization(): void;
}
export {};
