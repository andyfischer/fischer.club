import { Graph } from '../Graph';
import { QueryLike } from '../Query';
import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { Stream } from '../Stream';
import { Port } from '../utils/Port';
import { Module } from '../Module';
import { UseConfig, ServeConfig, Message } from './ProtocolCommon';
interface WebSocketServer {
    on(eventName: string, callback: any): void;
}
export interface Config {
    graph: Graph;
    use?: UseConfig;
    serve?: ServeConfig;
    singleConnection?: Port<Message, Message>;
}
interface Connection {
    id: number;
    port: Port<Message, Message>;
}
export declare class Server {
    graph: Graph;
    config: Config;
    nextConnectionId: IDSource;
    nextStreamId: IDSource;
    incomingInputStreams: Map<number, Stream>;
    incomingOutputStreams: Map<number, Stream>;
    connections: Map<number, Connection>;
    singleConnection: Connection;
    expectingConnectCid: number;
    expectedModule: Module;
    hostedModules: Map<string, Module>;
    singleConnectionProviderId: string;
    constructor(config: Config);
    start(): void;
    addWebSocketConnection(ws: any): void;
    addPortConnection(port: Port): Connection;
    setSingleConnection(port: Port): {
        id: number;
        port: Port<any, any>;
    };
    sendQueryToConnection(connection: Connection, queryLike: QueryLike, input: Stream): Stream;
    onMessage(connection: Connection, message: Message): void;
    warn(s: string): void;
}
export declare function connectRemote(config: Config): Server;
export declare function serverListenToWebSocket(server: Server, wsServer: WebSocketServer): void;
export {};
