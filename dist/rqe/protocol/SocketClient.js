"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagedSocketClient = exports.SocketClient = void 0;
const IDSource_1 = require("../utils/IDSource");
const config_1 = require("../config");
const Errors_1 = require("../Errors");
const consoleOutput_1 = require("../format/terminal/consoleOutput");
const StreamsBridge_1 = require("../socketv3/StreamsBridge");
const parseTableDecl_1 = require("../parser/parseTableDecl");
const TaggedValue_1 = require("../TaggedValue");
const Debug_1 = require("../Debug");
class SocketClient {
    constructor(options) {
        this.nextStreamId = new IDSource_1.IDSourceNumber();
        this.incomingStreams = new StreamsBridge_1.StreamsBridge();
        this.isOpen = false;
        this.outgoingQueue = [];
        this.ws = options.ws;
        this.options = options;
        const onMessage = (msg) => {
            if (config_1.SocketVerboseLog)
                console.log('SocketClient received: ' + msg.data);
            const parsed = JSON.parse(msg.data);
            switch (parsed.t) {
                case 'outputMsg':
                    try {
                        this.incomingStreams.receiveMessage(parsed.stream, parsed.msg);
                    }
                    catch (e) {
                        const error = (0, Errors_1.captureExceptionAsErrorItem)(e);
                        const closeMsg = {
                            t: 'closeStreamMsg',
                            stream: parsed.stream,
                            error,
                        };
                        const jsonMsg = JSON.stringify(closeMsg);
                        if (config_1.SocketVerboseLog)
                            console.log('SocketClient send: ' + jsonMsg);
                        this.ws.send(jsonMsg);
                    }
                    break;
                case 'closeStreamMsg':
                    this.incomingStreams.forceClose(parsed.stream, parsed.error);
                    break;
            }
        };
        const onOpen = () => {
            if (this.options.authenticationKey) {
                this.query('socket-protocol authenticate $key', { key: this.options.authenticationKey }, { skipQueue: true })
                    .then(() => {
                    this.setOpenAndSendQueue();
                });
            }
            else {
                this.setOpenAndSendQueue();
            }
        };
        const onError = (e) => {
            const error = (0, Errors_1.captureExceptionAsErrorItem)(e);
            error.errorType = 'socket_protocol_error';
            (0, consoleOutput_1.consoleLogError)(error);
            this.incomingStreams.forceCloseAll(error);
        };
        const onClose = () => {
            this.incomingStreams.forceCloseAll({ errorType: 'socket_closed' });
        };
        this.ws.addEventListener('message', onMessage);
        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);
        this.ws.addEventListener('close', onClose);
    }
    setOpenAndSendQueue() {
        for (const msg of this.outgoingQueue) {
            (0, Debug_1.assertDataIsSerializable)(msg);
            this.ws.send(JSON.stringify(msg));
        }
        this.outgoingQueue = [];
        this.isOpen = true;
    }
    query(query, params = null, context = {}) {
        const outputStreamId = this.nextStreamId.take();
        const output = this.incomingStreams.startStream(outputStreamId);
        const skipQueue = context === null || context === void 0 ? void 0 : context.skipQueue;
        const queryMsg = {
            t: 'queryMsg',
            query: (0, TaggedValue_1.toSerializable)(query),
            params,
            output: outputStreamId,
            resourceTags: context === null || context === void 0 ? void 0 : context.resourceTags,
        };
        if (this.isOpen || skipQueue) {
            (0, Debug_1.assertDataIsSerializable)(queryMsg);
            this.ws.send(JSON.stringify(queryMsg));
        }
        else {
            this.outgoingQueue.push(queryMsg);
        }
        return output;
    }
}
exports.SocketClient = SocketClient;
class ManagedSocketClient {
    constructor(options) {
        this.options = options;
    }
    query(query, params = null) {
        if (!this.socket) {
            const ws = this.options.openSocket();
            this.socket = new SocketClient({
                ws,
                authenticationKey: this.options.authenticationKey,
            });
            if (config_1.SocketVerboseLog) {
                console.log('ManagedSocketClient opened socket');
            }
        }
        return this.socket.query(query, params);
    }
    serveFunc(decl) {
        const mount = (0, parseTableDecl_1.parseTableDecl)(decl);
        return {
            ...mount,
            run(task) { }
        };
    }
}
exports.ManagedSocketClient = ManagedSocketClient;
//# sourceMappingURL=SocketClient.js.map