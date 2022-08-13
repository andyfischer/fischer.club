import { QueryLike, QueryParameters } from '../../Query';
import { Stream } from '../../Stream';
export interface ReplOptions {
    prompt?: string;
}
export interface Queryable {
    query: (query: QueryLike, params: QueryParameters) => Stream;
}
export declare function startConsoleRepl(graph: Queryable, opts?: ReplOptions): any;
