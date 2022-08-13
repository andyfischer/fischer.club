"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const FailureTracking_1 = require("../FailureTracking");
const IDSource_1 = require("../utils/IDSource");
const StreamsBridge_1 = require("./StreamsBridge");
const Query_1 = require("../Query");
const Errors_1 = require("../Errors");
const Stream_1 = require("../Stream");
const Listeners_1 = require("../Listeners");
const Debug_1 = require("../Debug");
const TaggedValue_1 = require("../TaggedValue");
class Connection {
    constructor(config) {
        this.protocolReadyState = 'not_ready';
        this.outgoingQueue = [];
        this.serverStreams = new StreamsBridge_1.StreamsBridge();
        this.clientStreams = new StreamsBridge_1.StreamsBridge();
        this.clientNextStreamId = new IDSource_1.IDSourceNumber();
        this.config = config;
        this.config.protocol.onReadyStateChange.addListener((state) => this.onProtocolReadyStateChange(state));
        this.config.protocol.onMessage.addListener((msg) => this.onMessage(msg));
        if (config.server) {
            this.serverResourceTag = 'socket-' + this.config.server.graph.nextResourceTag.take();
        }
    }
    disconnect(errorType = 'connection_disconnect') {
        this.serverStreams.forceCloseAll({ errorType });
        this.clientStreams.forceCloseAll({ errorType });
        if (this.config.server) {
            (0, Listeners_1.closeWithResourceTag)(this.config.server.graph, this.serverResourceTag);
        }
    }
    onProtocolReadyStateChange(state) {
        this.protocolReadyState = state;
        if (state === 'ready') {
            const queue = this.outgoingQueue;
            this.outgoingQueue = [];
            for (const outgoing of queue) {
                this.sendQuery(outgoing);
            }
            if (this.config.onReady)
                this.config.onReady(this);
        }
        if (state === 'failed') {
            this.disconnect('connection_failed');
        }
    }
    onMessage(msg) {
        switch (msg.t) {
            case 'inputMsg':
                if (!this.config.server)
                    throw new Error("on inputMsg - Connection wasn't configured as a server");
                try {
                    this.serverStreams.receiveMessage(msg.stream, msg.msg);
                }
                catch (e) {
                    const error = (0, Errors_1.captureExceptionAsErrorItem)(e);
                    const closeMsg = {
                        t: 'closeInputMsg',
                        stream: msg.stream,
                        error,
                    };
                    this.send(closeMsg);
                }
                break;
            case 'queryMsg': {
                if (!this.config.server)
                    throw new Error("on queryMsg - Connection wasn't configured as a server");
                let query = msg.query;
                const params = msg.params || {};
                const queryResourceTags = (msg.resourceTags || [])
                    .map(tag => this.serverResourceTag + '-query-' + tag);
                query = (0, Query_1.toQuery)(query);
                if (params['$input'])
                    params['$input'] = this.serverStreams.startStream(params['$input']);
                const stream = this.config.server.graph.query(query, params, {
                    resourceTags: [this.serverResourceTag].concat(queryResourceTags),
                });
                stream.sendTo(this.openStreamToClient(msg.output));
                break;
            }
            case 'closeInputMsg':
                this.clientStreams.forceClose(msg.stream, msg.error);
                break;
            case 'closeOutputMsg':
                this.serverStreams.forceClose(msg.stream, msg.error);
                break;
            case 'outputMsg': {
                if (!this.config.client)
                    throw new Error("on outputMsg - Connection wasn't configured as a client");
                try {
                    this.clientStreams.receiveMessage(msg.stream, msg.msg);
                }
                catch (e) {
                    const error = (0, Errors_1.captureExceptionAsErrorItem)(e);
                    const closeMsg = {
                        t: 'closeOutputMsg',
                        stream: msg.stream,
                        error,
                    };
                    this.send(closeMsg);
                }
                break;
            }
        }
    }
    openStreamToClient(outputStream) {
        return {
            receive: (msg) => {
                (0, Debug_1.assertDataIsSerializable)(msg);
                const outputMsg = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                };
                this.send(outputMsg);
            }
        };
    }
    send(msg) {
        try {
            this.config.protocol.send(msg);
        }
        catch (e) {
            (0, FailureTracking_1.recordUnhandledException)(e);
        }
    }
    query(query, params = null, context = {}) {
        if (!this.config.client)
            throw new Error("query() failed - Connection is not configured as client");
        if (this.protocolReadyState === 'failed') {
            const output = new Stream_1.Stream();
            output.forceClose({ errorType: 'connection_failed' });
            return output;
        }
        if (params && params['$input'])
            throw new Error("not yet supported: $input param");
        const outputStreamId = this.clientNextStreamId.take();
        const output = this.clientStreams.startStream(outputStreamId);
        const outgoing = { query, params, outputStreamId };
        this.config.protocol.prepare();
        switch (this.protocolReadyState) {
            case 'ready':
                this.sendQuery(outgoing);
                break;
            case 'not_ready':
                this.outgoingQueue.push(outgoing);
                break;
        }
        return output;
    }
    sendQuery(outgoing) {
        const queryMsg = {
            t: 'queryMsg',
            query: (0, TaggedValue_1.toSerializable)(outgoing.query),
            params: outgoing.params,
            output: outgoing.outputStreamId,
        };
        this.send(queryMsg);
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map