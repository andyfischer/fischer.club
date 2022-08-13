"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectPortProtocol = exports.Connection = void 0;
const Query_1 = require("../Query");
const MountPoint_1 = require("../MountPoint");
const rand_1 = require("../utils/rand");
const IDSource_1 = require("../utils/IDSource");
const Stream_1 = require("../Stream");
const ProtocolCommon_1 = require("./ProtocolCommon");
class Connection {
    constructor(config) {
        this.hasReceivedMounts = false;
        this.modules = new Map();
        this.nextStreamId = new IDSource_1.IDSourceNumber();
        this.incomingInputStreams = new Map();
        this.incomingOutputStreams = new Map();
        this.waitingForConnect = [];
        this.config = config;
        this.graph = config.graph;
        this.port = config.port;
    }
    start() {
        const config = this.config;
        this.port.onMessage.addListener(msg => this.onMessage(msg));
        if (config.serve) {
            (0, ProtocolCommon_1.addSchemaUpdateListener)(config.graph, config.serve, (moduleId, updatedSpec) => {
                this.port.postMessage({
                    t: 'updateModule',
                    moduleId,
                    spec: updatedSpec
                });
            });
        }
        if (config.use) {
            this.expectingConnectCid = (0, rand_1.randInt)(1000000);
            this.status = 'connecting';
            this.port.postMessage({
                t: 'connect',
                cid: this.expectingConnectCid,
                discoverApi: config.use.discoverApi,
            });
            if (config.use.expectedApi) {
                this.premountModule = this.graph.mount(config.use.expectedApi.map((point) => {
                    point = (0, MountPoint_1.resolveLooseMountPointSpec)(point);
                    const runWhileWaitingForConnect = (step) => {
                        step.streaming();
                        this.waitingForConnect.push(step);
                    };
                    return {
                        ...point,
                        providerId: this.provider_id,
                        run: runWhileWaitingForConnect,
                    };
                }));
            }
        }
    }
    onMessage(message) {
        switch (message.t) {
            case 'connect':
                if (!this.config.serve) {
                    this.port.postMessage({
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
                this.port.postMessage(reply);
                return;
            case 'connectReply':
                if (message.cid === this.expectingConnectCid) {
                    this.provider_id = (this.graph.providers().put({
                        runQuery: (q, i) => this.providerRunQuery(q, i)
                    })).provider_id;
                    for (const serverModuleEntry of message.modules) {
                        const newPoints = serverModuleEntry.points.map(point => {
                            return {
                                ...point,
                                providerId: this.provider_id,
                                run: (step) => {
                                    step.streaming();
                                    this.sendQueryToServer(step.tuple, step.input)
                                        .sendTo(step.output);
                                }
                            };
                        });
                        const module = this.graph.mount(newPoints);
                        this.modules.set(serverModuleEntry.id, module);
                    }
                    this.expectingConnectCid = 0;
                    this.status = 'open';
                    if (this.premountModule) {
                        this.premountModule.redefine([]);
                        this.premountModule = null;
                        const waitingSteps = this.waitingForConnect;
                        this.waitingForConnect = [];
                        for (const step of waitingSteps) {
                            this.sendQueryToServer(step.tuple, step.input)
                                .sendTo(step.output);
                        }
                    }
                    return;
                }
                return;
            case 'updateModule':
                if (this.status === 'connecting')
                    return;
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
                        this.port.postMessage({
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
                    this.warn("PortProtocol got message for unknown stream: " + message.streamId);
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
                    this.warn("PortProtocol got message for unknown stream: " + message.streamId);
                    return;
                }
                stream.receive(message.msg);
                if (message.msg.t === 'done')
                    this.incomingOutputStreams.delete(message.streamId);
                return;
            }
        }
    }
    sendQueryToServer(queryLike, input) {
        const outputId = this.nextStreamId.take();
        const output = new Stream_1.Stream();
        const query = (0, Query_1.toQuery)(queryLike);
        this.incomingOutputStreams.set(outputId, output);
        let inputId = 0;
        if (!input.isKnownEmpty()) {
            inputId = this.nextStreamId.take();
        }
        this.port.postMessage({
            t: 'query',
            query: query.toObject(),
            outputId,
            inputId,
        });
        input.sendTo({
            receive: (msg) => {
                this.port.postMessage({
                    t: 'streamInput',
                    streamId: inputId,
                    msg,
                });
            }
        });
        return output;
    }
    providerRunQuery(query, input) {
        return this.sendQueryToServer(query, input);
    }
    warn(msg) {
        console.warn(msg);
    }
}
exports.Connection = Connection;
function connectPortProtocol(config) {
    const connection = new Connection(config);
    connection.start();
    return connection;
}
exports.connectPortProtocol = connectPortProtocol;
//# sourceMappingURL=OldPortProtocol.js.map