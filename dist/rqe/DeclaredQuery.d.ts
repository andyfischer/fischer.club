import { Graph } from './Graph';
import { Query, QueryLike } from './Query';
export declare class DeclaredQuery {
    graph: Graph;
    query: Query;
    constructor(graph: Graph, queryLike: QueryLike);
    run(parameters: any): import("./Stream").Stream;
}
