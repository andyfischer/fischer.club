import { Graph } from '../Graph';
import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { StreamEvent, StreamReceiver } from '../Stream';
import { QueryLike, Query } from '../Query';
import { StreamsBridge } from '../socketv3/StreamsBridge';
import { ErrorItem } from '../Errors';
interface ServerOptions {
    graph: Graph;
    wsServer: any;
    onConnection?: (connection: Connection) => void;
    onQuery?: (connection: Connection, query: Query) => void;
    onListen?: (connection: Connection, query: Query) => void;
    requireAuth?: boolean;
    checkAuthKey?: (key: string) => boolean | Promise<boolean>;
}
interface InputMessage {
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
interface OutputMessage {
    t: 'outputMsg';
    stream: number;
    msg: StreamEvent;
}
export interface CloseStreamMessage {
    t: 'closeStreamMsg';
    stream: number;
    error: ErrorItem;
}
export declare type MessageToServer = InputMessage | QueryMessage | CloseStreamMessage;
export declare type MessageToClient = OutputMessage | CloseStreamMessage;
declare class Connection {
    ws: any;
    hasAuthenticated: boolean;
    state: any;
    constructor(ws: any);
}
export declare class SocketServer {
    incomingStreams: StreamsBridge;
    nextConnectionId: IDSource;
    options: ServerOptions;
    graph: Graph;
    constructor(options: ServerOptions);
    listenToConnection(ws: any): void;
    outgoingStream(conn: Connection, outputStream: number): StreamReceiver;
}
export {};
