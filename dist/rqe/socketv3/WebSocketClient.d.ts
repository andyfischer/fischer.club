import { ConnectionProtocol, Message, ProtocolReadyState } from './Connection';
import { LocalEventSource } from '../utils/Port';
interface WebSocket {
    addEventListener(name: string, callback: any): void;
    removeEventListener(name: string, callback: any): void;
    send(msg: string): void;
}
interface Config {
    openSocket(): WebSocket;
}
export declare class WebSocketClient implements ConnectionProtocol {
    config: Config;
    readyState: ProtocolReadyState;
    ws: WebSocket;
    onReadyStateChange: LocalEventSource;
    onMessage: LocalEventSource;
    connectFailedRetryCount: number;
    reconnectTimer: any;
    constructor(config: Config);
    prepare(): void;
    openSocket(): void;
    setReadyState(state: ProtocolReadyState): void;
    send(msg: Message): void;
    onConnectFailed(): void;
}
export {};
