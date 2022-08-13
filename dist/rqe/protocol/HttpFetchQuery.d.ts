import { QueryLike } from '../Query';
import { Stream, StreamEvent } from '../Stream';
interface ClientConfig {
    endpoint: string;
    beforeSend?: (options: any) => any;
    headers?: {
        [key: string]: string;
    };
    fetch: any;
}
interface QueryOptions {
    one?: boolean;
}
export interface Request {
    query: QueryLike;
    params?: QueryLike;
    one?: boolean;
}
export interface Response {
    error?: string;
    events: StreamEvent[];
}
export declare class FetchClient {
    config: ClientConfig;
    constructor(config: ClientConfig);
    query(query: QueryLike, params: any, opts?: QueryOptions): Stream;
}
export {};
