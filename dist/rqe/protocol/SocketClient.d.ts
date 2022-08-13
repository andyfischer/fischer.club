import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { Stream } from '../Stream';
import { QueryLike } from '../Query';
import { QueryMessage } from './SocketServer';
import { StreamsBridge } from '../socketv3/StreamsBridge';
import { MountPointSpec } from '../MountPoint';
interface ClientOptions {
    ws: any;
    authenticationKey?: string;
}
interface QueryContext {
    skipQueue?: boolean;
    resourceTags?: string[];
}
export declare class SocketClient {
    nextStreamId: IDSource;
    incomingStreams: StreamsBridge;
    isOpen: boolean;
    options: ClientOptions;
    outgoingQueue: QueryMessage[];
    ws: any;
    constructor(options: ClientOptions);
    setOpenAndSendQueue(): void;
    query(query: QueryLike, params?: any, context?: QueryContext): Stream;
}
interface ManagedSocketClientOptions {
    openSocket: () => any;
    authenticationKey?: string;
}
export declare class ManagedSocketClient {
    socket: SocketClient;
    options: ManagedSocketClientOptions;
    constructor(options: ManagedSocketClientOptions);
    query(query: QueryLike, params?: any): Stream;
    serveFunc(decl: string): MountPointSpec;
}
export {};
