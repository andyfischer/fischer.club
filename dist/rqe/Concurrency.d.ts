import { Item } from './Item';
import { Stream, StreamReceiver, StreamEvent, StreamDone } from './Stream';
import { Table } from './Table';
export declare type StreamingTransformFunc = (item: Item) => Stream;
export interface StreamingTransformOptions {
    maxConcurrency?: number;
}
export declare function streamingTransform(from: Stream, receiver: StreamReceiver, callback: StreamingTransformFunc, options?: StreamingTransformOptions): void;
export declare function aggregateMultiple(streams: Stream[], output: Stream, onReadyHandler: (results: Table[], output: Stream) => void): void;
interface AggregateData {
    t: 'aggregateData';
    streamIndex: number;
    msg: StreamEvent;
}
declare type AggregateEvent = AggregateData | StreamDone;
export declare function streamingAggregate(streams: Stream[], receiver: (event: AggregateEvent) => void): void;
export {};
