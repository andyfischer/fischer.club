"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamsBridge = void 0;
const Stream_1 = require("../Stream");
const Debug_1 = require("../Debug");
const FailureTracking_1 = require("../FailureTracking");
class StreamsBridge {
    constructor() {
        this.streams = new Map();
        this.validators = new Map();
    }
    startStream(id) {
        if (this.streams.has(id))
            throw new Error("BridgeStreams protocol error: already have stream with id: " + id);
        let stream = new Stream_1.Stream(null, 'Socket.BridgeStreams for connection=' + id);
        this.streams.set(id, stream);
        this.validators.set(id, new Debug_1.StreamProtocolValidator(`stream validator for socket id=${id}`));
        return stream;
    }
    receiveMessage(id, msg) {
        const stream = this.streams.get(id);
        if (!stream)
            throw new Error("BridgeStreams protocol error: no stream with id: " + id);
        this.validators.get(id).check(msg);
        if (msg.t === 'done') {
            this.streams.delete(id);
            this.validators.delete(id);
        }
        stream.receive(msg);
    }
    forceClose(id, error) {
        const stream = this.streams.get(id);
        if (!stream)
            return;
        this.streams.delete(id);
        this.validators.delete(id);
        stream.forceClose(error);
    }
    forceCloseAll(error) {
        for (const stream of this.streams.values()) {
            try {
                stream.forceClose(error);
            }
            catch (e) {
                (0, FailureTracking_1.recordUnhandledException)(e);
            }
        }
        this.streams.clear();
        this.validators.clear();
    }
}
exports.StreamsBridge = StreamsBridge;
//# sourceMappingURL=StreamsBridge.js.map