import { Query, QueryLike } from '../Query';
import { Port } from '../utils/Port';
import { Graph } from '../Graph';
import { Module } from '../Module';
import { Step } from '../Step';
import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { Stream } from '../Stream';
import { UseConfig, ServeConfig, Message } from './ProtocolCommon';
export interface ConnectionConfig {
    graph: Graph;
    port: Port<Message, Message>;
    use?: UseConfig;
    serve?: ServeConfig;
}
declare type ConnectionStatus = 'connecting' | 'open';
export declare class Connection {
    config: ConnectionConfig;
    hasReceivedMounts: boolean;
    status: ConnectionStatus;
    expectingConnectCid: number;
    graph: Graph;
    port: Port<Message, Message>;
    modules: Map<string, Module>;
    nextStreamId: IDSource;
    incomingInputStreams: Map<number, Stream>;
    incomingOutputStreams: Map<number, Stream>;
    premountModule: Module;
    waitingForConnect: Step[];
    provider_id: string;
    constructor(config: ConnectionConfig);
    start(): void;
    onMessage(message: Message): void;
    sendQueryToServer(queryLike: QueryLike, input: Stream): Stream;
    providerRunQuery(query: Query, input: Stream): Stream;
    warn(msg: string): void;
}
export declare function connectPortProtocol(config: ConnectionConfig): Connection;
export {};
