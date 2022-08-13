import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { StreamsBridge } from './StreamsBridge';
import { QueryLike, QueryParameters } from '../Query';
import { Graph, Queryable } from '../Graph';
import { ErrorItem } from '../Errors';
import { Stream, StreamEvent, StreamReceiver } from '../Stream';
import { EventSource } from '../utils/Port';
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
interface ConnectionConfig {
    protocol: ConnectionProtocol;
    onReady?: (conn: Connection) => void;
    server?: {
        graph: Graph;
    };
    client?: {};
}
interface QueryContext {
    resourceTags?: string[];
}
export declare type MessageToServer = InputMessage | QueryMessage | CloseInputStreamMessage;
export declare type MessageToClient = OutputMessage | CloseOutputStreamMessage;
export declare type Message = MessageToServer | MessageToClient;
export interface ConnectionProtocol {
    onReadyStateChange: EventSource;
    onMessage: EventSource;
    prepare(): void;
    send(msg: Message): void;
}
export declare type ProtocolReadyState = 'ready' | 'not_ready' | 'failed';
interface OutgoingQuery {
    query: QueryLike;
    params: QueryParameters;
    outputStreamId: number;
}
export declare class Connection implements Queryable {
    config: ConnectionConfig;
    protocolReadyState: ProtocolReadyState;
    outgoingQueue: OutgoingQuery[];
    serverStreams: StreamsBridge;
    serverResourceTag: string;
    clientStreams: StreamsBridge;
    clientNextStreamId: IDSource;
    constructor(config: ConnectionConfig);
    disconnect(errorType?: string): void;
    onProtocolReadyStateChange(state: ProtocolReadyState): void;
    onMessage(msg: any): void;
    openStreamToClient(outputStream: number): StreamReceiver;
    send(msg: Message): void;
    query(query: QueryLike, params?: any, context?: QueryContext): Stream;
    sendQuery(outgoing: OutgoingQuery): void;
}
export {};
