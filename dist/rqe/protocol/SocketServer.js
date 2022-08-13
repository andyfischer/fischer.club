"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const IDSource_1 = require("../utils/IDSource");
const Stream_1 = require("../Stream");
const Query_1 = require("../Query");
const config_1 = require("../config");
const FailureTracking_1 = require("../FailureTracking");
const Debug_1 = require("../Debug");
const Listeners_1 = require("../Listeners");
const StreamsBridge_1 = require("../socketv3/StreamsBridge");
const Errors_1 = require("../Errors");
class Connection {
    constructor(ws) {
        this.ws = ws;
    }
}
async function socketLevelQuery(server, conn, query, params) {
    if (query.t !== 'query') {
        console.error('why is this not a query', query);
    }
    if (query.steps.length !== 1) {
        return null;
    }
    const tuple = query.steps[0];
    if (!tuple.has('socket-protocol'))
        return null;
    if (tuple.has('authenticate')) {
        if (!server.options.checkAuthKey) {
            return { stream: Stream_1.Stream.errorToStream({
                    errorType: 'auth_failed',
                    message: "server has no .checkAuthKey handler"
                }) };
        }
        const key = params.key;
        const success = await server.options.checkAuthKey(key);
        if (success) {
            conn.hasAuthenticated = true;
            return { stream: Stream_1.Stream.fromList([]) };
        }
        return { stream: Stream_1.Stream.errorToStream({
                errorType: 'auth_failed',
                message: "invalid key",
            }) };
    }
    return null;
}
class SocketServer {
    constructor(options) {
        this.incomingStreams = new StreamsBridge_1.StreamsBridge();
        this.nextConnectionId = new IDSource_1.IDSourceNumber();
        this.graph = options.graph;
        this.options = options;
        options.wsServer.on('connection', ws => {
            this.listenToConnection(ws);
        });
    }
    listenToConnection(ws) {
        const conn = new Connection(ws);
        const socketResourceTag = 'socket-' + this.graph.nextResourceTag.take();
        if (this.options.onConnection)
            this.options.onConnection(conn);
        let id = this.nextConnectionId.take();
        let onMessage = async (msg) => {
            if (config_1.SocketVerboseLog)
                console.log('socket received: ' + msg.data);
            const parsed = JSON.parse(msg.data);
            switch (parsed.t) {
                case 'inputMsg':
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
                            console.log('SocketServer send: ' + jsonMsg);
                        conn.ws.send(jsonMsg);
                    }
                    return;
                case 'queryMsg': {
                    let query = parsed.query;
                    const params = parsed.params || {};
                    const queryResourceTags = (parsed.resourceTags || [])
                        .map(tag => socketResourceTag + '-query-' + tag);
                    query = (0, Query_1.toQuery)(query);
                    if (this.options.onQuery) {
                        try {
                            this.options.onQuery(conn, query);
                        }
                        catch (e) {
                            (0, FailureTracking_1.recordUnhandledException)(e, this.graph);
                        }
                    }
                    let output = await socketLevelQuery(this, conn, query, params);
                    if (output) {
                        output.stream.sendTo(this.outgoingStream(conn, parsed.output));
                        return;
                    }
                    if (this.options.requireAuth && !conn.hasAuthenticated) {
                        Stream_1.Stream.errorToStream({ errorType: 'protocol_error_need_to_authenticate' })
                            .sendTo(this.outgoingStream(conn, parsed.output));
                        return;
                    }
                    if (params['$input'])
                        params['$input'] = this.incomingStreams.startStream(params['$input']);
                    const stream = this.graph.query(query, params, {
                        socketConnection: conn,
                        resourceTags: [socketResourceTag].concat(queryResourceTags),
                    });
                    stream.sendTo(this.outgoingStream(conn, parsed.output));
                    return;
                }
                case 'closeStreamMsg':
                    this.incomingStreams.forceClose(parsed.stream, parsed.error);
                    break;
            }
        };
        let onClose = () => {
            (0, Listeners_1.closeWithResourceTag)(this.graph, socketResourceTag);
        };
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
    }
    outgoingStream(conn, outputStream) {
        return {
            receive: (msg) => {
                (0, Debug_1.assertDataIsSerializable)(msg);
                const outputMsg = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                };
                const jsonMsg = JSON.stringify(outputMsg);
                if (config_1.SocketVerboseLog)
                    console.log('SocketServer send: ' + jsonMsg);
                conn.ws.send(jsonMsg);
            }
        };
    }
}
exports.SocketServer = SocketServer;
//# sourceMappingURL=SocketServer.js.map