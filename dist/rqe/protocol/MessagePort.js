"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagePort = void 0;
const IDSource_1 = require("../utils/IDSource");
const Query_1 = require("../Query");
const Debug_1 = require("../Debug");
const Listeners_1 = require("../Listeners");
const StreamsBridge_1 = require("../socketv3/StreamsBridge");
const TaggedValue_1 = require("../TaggedValue");
const Errors_1 = require("../Errors");
class MessagePort {
    constructor(config) {
        this.serverStreams = new StreamsBridge_1.StreamsBridge();
        this.clientStreams = new StreamsBridge_1.StreamsBridge();
        this.clientNextStreamId = new IDSource_1.IDSourceNumber();
        this.isDisconnected = false;
        this.config = config;
        if (this.config.server) {
            this.serverResourceTag = 'message-port-' + this.config.server.graph.nextResourceTag.take();
        }
        config.port.onMessage.addListener(msg => this.onMessage(msg));
        config.port.onDisconnect.addListener(() => this.disconnect());
    }
    disconnect() {
        this.isDisconnected = true;
        this.serverStreams.forceCloseAll({ errorType: 'message_port_disconnect' });
        this.clientStreams.forceCloseAll({ errorType: 'message_port_disconnect' });
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
                    this.config.port.postMessage(closeMsg);
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
                if (this.config.server.onQuery)
                    this.config.server.onQuery(query);
                if (params['$input'])
                    params['$input'] = this.serverStreams.startStream(params['$input']);
                const stream = this.config.server.graph.query(query, params, {
                    resourceTags: [this.serverResourceTag].concat(queryResourceTags),
                });
                stream.sendTo(this.outgoingStream(msg.output));
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
                    this.config.port.postMessage(closeMsg);
                }
                break;
            }
        }
    }
    outgoingStream(outputStream) {
        return {
            receive: (msg) => {
                (0, Debug_1.assertDataIsSerializable)(msg);
                const outputMsg = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                };
                this.config.port.postMessage(outputMsg);
            }
        };
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
        this.config.port.postMessage(queryMsg);
        return output;
    }
}
exports.MessagePort = MessagePort;
//# sourceMappingURL=MessagePort.js.map