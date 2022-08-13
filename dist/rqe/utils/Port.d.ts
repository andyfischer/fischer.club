export declare class LocalEventSource implements EventSource {
    listeners: any[];
    addListener(callback: any): void;
    removeListener(callback: any): void;
    emit(msg?: any): void;
}
export interface EventSource<MessageType = any> {
    addListener(callback: (msg: MessageType) => void): void;
    removeListener(callback: any): void;
}
export interface Port<IncomingMessage = any, OutgoingMessage = any> {
    postMessage(msg: OutgoingMessage): any;
    disconnect(): void;
    onMessage: EventSource<IncomingMessage>;
    onDisconnect: EventSource<any>;
}
export declare function portErrorWrap(port: Port, onPortError: (e: any) => void): Port;
export declare function createLocalPortPair(): any[];
