"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverListenToWebSocket = exports.connectRemote = exports.Server = void 0;
const Query_1 = require("../Query");
const IDSource_1 = require("../utils/IDSource");
const MountPoint_1 = require("../MountPoint");
const Stream_1 = require("../Stream");
const Item_1 = require("../Item");
const rand_1 = require("../utils/rand");
class Server {
    constructor(config) {
        this.nextConnectionId = new IDSource_1.IDSourceNumber();
        this.nextStreamId = new IDSource_1.IDSourceNumber();
        this.incomingInputStreams = new Map();
        this.incomingOutputStreams = new Map();
        this.connections = new Map();
        this.hostedModules = new Map();
        this.config = config;
        this.graph = config.graph;
        if (config.use) {
            if (config.use.discoverApi && !config.singleConnection)
                throw new Error(".discoverApi requires a singleConnection");
        }
    }
    start() {
        if (this.config.use && this.config.singleConnection) {
            this.setSingleConnection(this.config.singleConnection);
            const provider = this.graph.addProvider((q, i) => {
                return this.sendQueryToConnection(this.singleConnection, q, i);
            });
            this.singleConnectionProviderId = provider.provider_id;
        }
        if (this.config.use && this.config.use.discoverApi) {
            this.expectingConnectCid = (0, rand_1.randInt)(1000000);
            this.singleConnection.port.postMessage({
                t: 'connect',
                cid: this.expectingConnectCid,
                discoverApi: this.config.use.discoverApi,
            });
        }
        if (this.config.use && this.config.use.expectedApi) {
            this.expectedModule = this.graph.mount(this.config.use.expectedApi.map((point) => {
                point = (0, MountPoint_1.resolveLooseMountPointSpec)(point);
                return {
                    ...point,
                    run: (step) => {
                        const args = step.args();
                        const query = step.tuple.shallowCopy();
                        let connectionId;
                        if (this.config.use.connectionAttr) {
                            connectionId = (0, Item_1.get)(args, this.config.use.connectionAttr);
                            query.deleteAttr(this.config.use.connectionAttr);
                        }
                        let connection;
                        if (connectionId) {
                            connection = this.connections.get(connectionId);
                        }
                        else {
                            if (!this.singleConnection) {
                                throw new Error("Got a request with no connection attribute");
                            }
                            else {
                                connection = this.singleConnection;
                            }
                        }
                        const input = step.input;
                        if (!connection) {
                            throw new Error("connection not found: " + connectionId);
                        }
                        this.sendQueryToConnection(connection, query, input)
                            .sendTo(step.output);
                    }
                };
            }));
        }
    }
    addWebSocketConnection(ws) {
        let id;
        const port = {
            onMessage: {
                addListener(callback) {
                    ws.addEventListener('send', msg => {
                        const parsed = JSON.parse(msg);
                        callback(msg);
                    });
                },
                removeListener(callback) {
                    ws.removeEventListener('send', callback);
                },
            },
            onDisconnect: {
                addListener(callback) {
                    ws.addEventListener('close', callback);
                },
                removeListener(callback) {
                    ws.removeEventListener('close', callback);
                },
            },
            postMessage: (msg) => {
                ws.send(JSON.stringify(msg));
            },
            disconnect: () => {
                ws.close();
                this.connections.delete(id);
            }
        };
        id = this.addPortConnection(port);
    }
    addPortConnection(port) {
        const id = this.nextConnectionId.take();
        const connection = { id, port };
        this.connections.set(id, connection);
        port.onMessage.addListener(message => {
            this.onMessage(connection, message);
        });
        return connection;
    }
    setSingleConnection(port) {
        const connection = { id: this.nextConnectionId.take(), port };
        this.singleConnection = connection;
        port.onMessage.addListener(message => {
            this.onMessage(connection, message);
        });
        return connection;
    }
    sendQueryToConnection(connection, queryLike, input) {
        let inputId = 0;
        const query = (0, Query_1.toQuery)(queryLike);
        const outputId = this.nextStreamId.take();
        const output = new Stream_1.Stream();
        this.incomingOutputStreams.set(outputId, output);
        if (!input.isKnownEmpty())
            inputId = this.nextStreamId.take();
        const msg = {
            t: 'query',
            query: query.toObject(),
            inputId,
            outputId,
        };
        connection.port.postMessage(msg);
        if (!input.isKnownEmpty()) {
            input.sendTo({
                receive: (msg) => {
                    const socketMsg = {
                        t: 'streamInput',
                        streamId: inputId,
                        msg
                    };
                    connection.port.postMessage(socketMsg);
                }
            });
        }
        return output;
    }
    onMessage(connection, message) {
        switch (message.t) {
            case 'connect':
                if (!this.config.serve) {
                    connection.port.postMessage({
                        t: 'usageError',
                        message: 'connection is not set up as server',
                    });
                    return;
                }
                const reply = {
                    t: 'connectReply',
                    cid: message.cid,
                    modules: [],
                };
                for (const module of this.graph.modules) {
                    const servedPoints = [];
                    for (const point of module.points) {
                        if (this.config.serve.shouldServe(point.spec)) {
                            servedPoints.push({
                                ...point.spec,
                                module: null,
                                run: null,
                            });
                        }
                    }
                    if (message.discoverApi) {
                        if (servedPoints.length > 0) {
                            reply.modules.push({
                                id: module.moduleId,
                                points: servedPoints,
                            });
                        }
                    }
                }
                connection.port.postMessage(reply);
                return;
            case 'connectReply':
                if (!this.singleConnection) {
                    console.warn('got unexpected message (no singleConnection):', message);
                    return;
                }
                if (message.cid === this.expectingConnectCid) {
                    if (this.expectedModule)
                        this.expectedModule.redefine([]);
                    for (const serverModuleEntry of message.modules) {
                        const newPoints = serverModuleEntry.points.map(point => {
                            return {
                                ...point,
                                providerId: this.singleConnectionProviderId,
                                run: (step) => {
                                    step.streaming();
                                    this.sendQueryToConnection(this.singleConnection, step.tuple, step.input)
                                        .sendTo(step.output);
                                }
                            };
                        });
                        const module = this.graph.mount(newPoints);
                        this.hostedModules.set(serverModuleEntry.id, module);
                    }
                    this.expectingConnectCid = 0;
                    return;
                }
                return;
            case 'updateModule':
                console.log('unimp: updateModule');
                return;
            case 'query': {
                const parameters = {};
                if (message.inputId !== 0) {
                    const stream = new Stream_1.Stream();
                    parameters['$input'] = stream;
                    this.incomingInputStreams.set(message.inputId, stream);
                }
                const query = Query_1.Query.fromObject(message.query);
                this.graph.query(query, parameters)
                    .sendTo({
                    receive: (msg) => {
                        connection.port.postMessage({
                            t: 'streamOutput',
                            streamId: message.outputId,
                            msg
                        });
                    }
                });
                return;
            }
            case 'streamInput': {
                const stream = this.incomingInputStreams.get(message.streamId);
                if (!stream) {
                    this.warn("RemoteServer got input message for unknown stream: " + message.streamId);
                    return;
                }
                stream.receive(message.msg);
                if (message.msg.t === 'done')
                    this.incomingInputStreams.delete(message.streamId);
                return;
            }
            case 'streamOutput': {
                const stream = this.incomingOutputStreams.get(message.streamId);
                if (!stream) {
                    this.warn("RemoteServer got output message for unknown stream: " + message.streamId);
                    return;
                }
                stream.receive(message.msg);
                if (message.msg.t === 'done')
                    this.incomingOutputStreams.delete(message.streamId);
                return;
            }
        }
    }
    warn(s) {
        console.warn('WSServer: ' + s);
    }
}
exports.Server = Server;
function connectRemote(config) {
    const connection = new Server(config);
    connection.start();
    return connection;
}
exports.connectRemote = connectRemote;
function serverListenToWebSocket(server, wsServer) {
    wsServer.on('connection', ws => {
        server.addWebSocketConnection(ws);
    });
}
exports.serverListenToWebSocket = serverListenToWebSocket;
//# sourceMappingURL=RemoteServer.js.map