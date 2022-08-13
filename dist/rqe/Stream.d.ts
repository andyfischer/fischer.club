import { Item } from './Item';
import { Table } from './Table/index';
import { ErrorItem, ErrorType } from './Errors';
import { StreamingTransformFunc, StreamingTransformOptions } from './Concurrency';
import { FutureValue } from './FutureValue';
import { Graph } from './Graph';
interface StreamItem {
    t: 'item';
    item: any;
}
export interface StreamDone {
    t: 'done';
}
export interface StreamError {
    t: 'error';
    item: ErrorItem;
}
export interface StreamHeader {
    t: 'header';
    item: Item;
}
export interface StreamPatchMode {
    t: 'patch_mode';
}
export interface StreamStartPatch {
    t: 'start_patch';
    replaceAll?: boolean;
}
export interface StreamFinishPatch {
    t: 'finish_patch';
}
export interface StreamDelete {
    t: 'delete';
    item: any;
}
export interface AttrSchema {
    type?: string;
}
export interface SchemaItem {
    [attr: string]: AttrSchema;
}
export interface StreamSchema {
    t: 'schema';
    item: SchemaItem;
}
export declare type TransformFunc = (item: Item) => Item | Item[];
export declare type AggregationFunc = (item: Item[]) => Item | Item[];
export declare type StreamEvent = StreamHeader | StreamItem | StreamDone | StreamError | StreamSchema | StreamPatchMode | StreamStartPatch | StreamFinishPatch | StreamDelete;
export interface StreamReceiver {
    receive(data: StreamEvent): void;
}
export declare class Stream {
    t: string;
    id: number;
    label?: string;
    graph?: Graph;
    downstream: StreamReceiver;
    receivedDone: boolean;
    closedWithError: ErrorItem | null;
    patchMode: PatchModeInfo;
    _backlog: StreamEvent[];
    _backpressureStop: boolean;
    constructor(graph?: Graph, label?: string);
    isDone(): boolean;
    hasDownstream(): boolean;
    isKnownEmpty(): boolean;
    getDebugLabel(): string;
    receive(data: StreamEvent): void;
    sendTo(receiver: StreamReceiver): void;
    onOverflowCheckTimeout(): void;
    transform(output: StreamReceiver, callback: TransformFunc): void;
    tap(callback: (msg: StreamEvent) => void): Stream;
    tapItems(callback: (item: Item) => void): Stream;
    toTransform(callback: TransformFunc): Stream;
    streamingTransform(output: Stream, callback: StreamingTransformFunc, options?: StreamingTransformOptions): void;
    aggregate(receiver: StreamReceiver, callback: AggregationFunc): void;
    collect(): Promise<Table>;
    collectWithErrors(): Promise<Table>;
    then(onResolve?: (result: Table) => any, onReject?: any): Promise<Table>;
    callback(callback: (table: Table) => void): void;
    sync(opts?: 'with_errors' | null): Table;
    strs(): string[];
    [Symbol.iterator](): Generator<any, void, unknown>;
    [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown>;
    one(): FutureValue;
    take(): any[];
    takeItemsAndErrors(): any[][];
    putHeader(item: Item): void;
    putSchema(item: SchemaItem): void;
    put(item: Item): void;
    putError(item: ErrorItem): void;
    errorAndClose(item: ErrorItem): void;
    putTableItems(table: Table): void;
    sendError(type: ErrorType, data?: any): void;
    sendErrorItem(item: ErrorItem): void;
    sendUnhandledError(error: Error): void;
    close(): void;
    forceClose(error: ErrorItem): void;
    closeWithError(message: string): void;
    closeWithErrorIfOpen(error: ErrorItem): void;
    closeWithUnhandledError(e: Error): void;
    done(): void;
    sendDoneIfNeeded(): void;
    setBackpressureStop(): void;
    static newEmptyStream(): Stream;
    static fromList(items: Item[]): Stream;
    static newStreamToReceiver(receiver: StreamReceiver): Stream;
    static errorToStream(item: ErrorItem): Stream;
}
interface PatchModeInfo {
    overflowCheck: any;
}
export declare class BackpressureStop extends Error {
    backpressure_stop: boolean;
    constructor();
}
export {};
