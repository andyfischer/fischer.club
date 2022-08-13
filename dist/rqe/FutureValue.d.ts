import { StreamEvent, StreamError, StreamDone } from './Stream';
import { Item } from './Item';
import { QueryLike } from './Query';
declare type Callback = (msg: StreamEvent | StreamError | StreamDone) => void;
export declare class FutureValue {
    msg: StreamEvent | StreamError | StreamDone;
    downstream: Callback;
    originalQuery: QueryLike;
    constructor(originalQuery?: QueryLike);
    callback(callback: Callback): void;
    receive(msg: StreamEvent): void;
    sync(): any;
    then(onResolve?: (item: Item) => any, onReject?: any): Promise<Item>;
    attr(attr: string): FutureAttr;
}
export declare class FutureAttr {
    value: FutureValue;
    attr: string;
    constructor(value: FutureValue, attr: string);
    sync(): any;
    then(onResolve?: (item: Item) => any, onReject?: any): Promise<Item>;
}
export {};
