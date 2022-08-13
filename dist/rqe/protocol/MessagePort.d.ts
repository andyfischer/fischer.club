import { Graph } from '../Graph';
import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { Stream, StreamEvent, StreamReceiver } from '../Stream';
import { QueryLike, Query } from '../Query';
import { StreamsBridge } from '../socketv3/StreamsBridge';
import { Port } from '../utils/Port';
import { ErrorItem } from '../Errors';
export interface Config {
    port: Port;
    server?: {
        graph: Graph;
        onQuery?: (query: Query) => void;
    };
    client?: {};
}
export interface InputMessage {
    t: 'inputMsg';
    stream: number;
    msg: StreamEvent;
}
export interface QueryMessage {
    t: 'queryMsg';
    query: QueryLike;
    params: any;
    output: number;
    resourceTags?: string[];
}
export interface OutputMessage {
    t: 'outputMsg';
    stream: number;
    msg: StreamEvent;
}
export interface CloseInputStreamMessage {
    t: 'closeInputMsg';
    stream: number;
    error: ErrorItem;
}
export interface CloseOutputStreamMessage {
    t: 'closeOutputMsg';
    stream: number;
    error: ErrorItem;
}
interface QueryContext {
    resourceTags?: string[];
}
export declare type MessageToServer = InputMessage | QueryMessage | CloseInputStreamMessage;
export declare type MessageToClient = OutputMessage | CloseOutputStreamMessage;
export declare class MessagePort {
    config: Config;
    serverResourceTag: string;
    serverStreams: StreamsBridge;
    clientStreams: StreamsBridge;
    clientNextStreamId: IDSource;
    isDisconnected: boolean;
    constructor(config: Config);
    disconnect(): void;
    onMessage(msg: any): void;
    outgoingStream(outputStream: number): StreamReceiver;
    query(query: QueryLike, params?: any, context?: QueryContext): Stream;
}
export {};
