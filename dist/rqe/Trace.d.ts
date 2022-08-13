import { Query, QueryLike, QueryParameters } from './Query';
interface Event {
    t: 'event' | 'open' | 'close';
    data: Query;
}
export declare class Trace {
    log: Event[];
    stack: Query[];
    id: number;
    constructor();
    event(evt: QueryLike, params?: QueryParameters): void;
    open(evt: QueryLike, params?: QueryParameters): void;
    close(evt: QueryLike, params?: QueryParameters): void;
    str(): string;
}
export {};
