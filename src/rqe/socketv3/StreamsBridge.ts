
import { Stream, StreamEvent, StreamReceiver } from '../Stream'
import { assertDataIsSerializable, wrapStreamInValidator, StreamProtocolValidator } from '../Debug'
import { ErrorItem } from '../Errors'
import { recordUnhandledException } from '../FailureTracking'

/*
 StreamsBridge

 A StreamsBridge stores a set of open streams, each with a unique ID. The use case
 is when "bridging" a stream across a serialization protocol like a socket. Each
 side of the connection will have a StreamsBridge object to keep track of the live
 Stream objects on their side.
*/

export class StreamsBridge {
    streams = new Map<number, Stream>();
    validators = new Map<number, StreamProtocolValidator>();
    
    startStream(id: number) {
        if (this.streams.has(id))
            throw new Error("BridgeStreams protocol error: already have stream with id: " + id);

        let stream = new Stream(null, 'Socket.BridgeStreams for connection=' + id);

        this.streams.set(id, stream);
        this.validators.set(id, new StreamProtocolValidator(`stream validator for socket id=${id}`));
        return stream;
    }

    receiveMessage(id: number, msg: StreamEvent) {
        const stream = this.streams.get(id);

        if (!stream)
            throw new Error("BridgeStreams protocol error: no stream with id: " + id);

        this.validators.get(id).check(msg);

        if (msg.t === 'done') {
            this.streams.delete(id);
            this.validators.delete(id);
        }

        // May throw an exception if the stream has errored:
        stream.receive(msg);
    }

    forceClose(id: number, error: ErrorItem) {
        const stream = this.streams.get(id);

        if (!stream)
            return;

        this.streams.delete(id);
        this.validators.delete(id);

        stream.forceClose(error);
    }

    forceCloseAll(error: ErrorItem) {
        for (const stream of this.streams.values()) {
            try {
                stream.forceClose(error);
            } catch (e) {
                recordUnhandledException(e);
            }
        }

        this.streams.clear();
        this.validators.clear();
    }
}

