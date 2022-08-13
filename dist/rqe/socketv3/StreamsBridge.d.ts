import { Stream, StreamEvent } from '../Stream';
import { StreamProtocolValidator } from '../Debug';
import { ErrorItem } from '../Errors';
export declare class StreamsBridge {
    streams: Map<number, Stream>;
    validators: Map<number, StreamProtocolValidator>;
    startStream(id: number): Stream;
    receiveMessage(id: number, msg: StreamEvent): void;
    forceClose(id: number, error: ErrorItem): void;
    forceCloseAll(error: ErrorItem): void;
}
