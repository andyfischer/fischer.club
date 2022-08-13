import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { StreamsBridge } from '../socketv3/StreamsBridge';
import { QueryLike } from '../Query';
import { Graph, Queryable } from '../Graph';
import { ErrorItem } from '../Errors';
import { Stream, StreamEvent, StreamReceiver } from '../Stream';
interface WebSocket {
    addEventListener(name: string, callback: any): void;
    send(msg: string): void;
}
interface Options {
    client: {
        openConnection: () => WebSocket;
    };
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
export declare type Message = MessageToServer | MessageToClient;
interface ConnectionConfig {
    postMessage(msg: MessageToServer | MessageToClient): void;
    server?: {
        graph: Graph;
    };
    client?: {};
}
export declare class Connection implements Queryable {
    config: ConnectionConfig;
    isReady: boolean;
    outgoingQueue: Message[];
    serverStreams: StreamsBridge;
    serverResourceTag: string;
    clientStreams: StreamsBridge;
    clientNextStreamId: IDSource;
    isDisconnected: boolean;
    constructor(config: ConnectionConfig);
    disconnect(errorType?: string): void;
    onMessage(msg: any): void;
    openStreamToClient(outputStream: number): StreamReceiver;
    postMessage(msg: Message): void;
    setReady(): void;
    query(query: QueryLike, params?: any, context?: QueryContext): Stream;
}
export declare class SocketClient2 implements Queryable {
    options: Options;
    connection: Connection;
    constructor(options: Options);
    createConnection(): void;
    query(query: QueryLike, params?: any, context?: QueryContext): Stream;
}
export {};
