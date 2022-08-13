"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClient2 = exports.Connection = void 0;
const FailureTracking_1 = require("../FailureTracking");
const IDSource_1 = require("../utils/IDSource");
const StreamsBridge_1 = require("../socketv3/StreamsBridge");
const Query_1 = require("../Query");
const Errors_1 = require("../Errors");
const Listeners_1 = require("../Listeners");
const Debug_1 = require("../Debug");
const TaggedValue_1 = require("../TaggedValue");
class Connection {
    constructor(config) {
        this.isReady = false;
        this.outgoingQueue = [];
        this.serverStreams = new StreamsBridge_1.StreamsBridge();
        this.clientStreams = new StreamsBridge_1.StreamsBridge();
        this.clientNextStreamId = new IDSource_1.IDSourceNumber();
        this.isDisconnected = false;
        this.config = config;
    }
    disconnect(errorType = 'connection_disconnect') {
        this.isDisconnected = true;
        this.serverStreams.forceCloseAll({ errorType });
        this.clientStreams.forceCloseAll({ errorType });
        if (this.config.server) {
            (0, Listeners_1.closeWithResourceTag)(this.config.server.graph, this.serverResourceTag);
        }
    }
    onMessage(msg) {
        switch (msg.t) {
            case 'inputMsg':
                if (!this.config.server)
                    throw new Error("on inputMsg - MessagePort wasn't configured as a server");
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
                    this.postMessage(closeMsg);
                }
                break;
            case 'queryMsg': {
                if (!this.config.server)
                    throw new Error("on queryMsg - MessagePort wasn't configured as a server");
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
                    throw new Error("on outputMsg - MessagePort wasn't configured as a client");
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
                    this.postMessage(closeMsg);
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
                this.postMessage(outputMsg);
            }
        };
    }
    postMessage(msg) {
        if (this.isReady) {
            try {
                this.config.postMessage(msg);
            }
            catch (e) {
                (0, FailureTracking_1.recordUnhandledException)(e);
            }
        }
        else {
            this.outgoingQueue.push(msg);
        }
    }
    setReady() {
        if (this.isReady)
            return;
        this.isReady = true;
        const queue = this.outgoingQueue;
        this.outgoingQueue = null;
        for (const msg of queue) {
            this.postMessage(msg);
        }
    }
    query(query, params = null, context = {}) {
        if (!this.config.client)
            throw new Error("query() failed - MessagePort is not configured as client");
        if (this.isDisconnected)
            throw new Error("query() failed - MessagePort has disconnected");
        const outputStreamId = this.clientNextStreamId.take();
        const output = this.clientStreams.startStream(outputStreamId);
        const queryMsg = {
            t: 'queryMsg',
            query: (0, TaggedValue_1.toSerializable)(query),
            params,
            output: outputStreamId,
        };
        this.postMessage(queryMsg);
        return output;
    }
}
exports.Connection = Connection;
class SocketClient2 {
    constructor(options) {
        this.options = options;
    }
    createConnection() {
        const ws = this.options.client.openConnection();
        const config = {
            postMessage(msg) {
                ws.send(JSON.stringify(msg));
            }
        };
        const connection = new Connection(config);
        ws.addEventListener('message', msg => {
            let parsed;
            try {
                parsed = JSON.parse(msg.data);
            }
            catch (e) {
                console.warn('Socket failed to parse JSON: ', msg.data);
                (0, FailureTracking_1.recordUnhandledException)(e);
            }
            connection.onMessage(parsed);
        });
        ws.addEventListener('open', () => {
            console.log('socket open');
            connection.setReady();
        });
        ws.addEventListener('error', (err) => {
            console.error('socket error', err);
            console.error(`here's the outgoing events`, connection.outgoingQueue);
            connection.disconnect('socket_error');
        });
        ws.addEventListener('close', () => {
            console.error('socket close');
            connection.disconnect('socket_close');
        });
        if (this.options.client) {
            config.client = {};
        }
        if (this.connection) {
            try {
                this.connection.disconnect();
            }
            catch (e) {
                (0, FailureTracking_1.recordUnhandledException)(e);
            }
        }
        this.connection = connection;
    }
    query(query, params = null, context = {}) {
        if (!this.connection || this.connection.isDisconnected)
            this.createConnection();
        return this.connection.query(query, params, context);
    }
}
exports.SocketClient2 = SocketClient2;
//# sourceMappingURL=SocketClient2.js.map