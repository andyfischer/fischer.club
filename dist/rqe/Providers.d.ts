import { Graph } from './Graph';
import { Query } from './Query';
import { Stream } from './Stream';
export interface Provider {
    provider_id?: string;
    runQuery(query: Query, input: Stream): Stream;
}
export declare function newProviderTable(graph: Graph): import("./Table").Table<Provider>;
