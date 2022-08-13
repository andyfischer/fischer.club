
import { Graph } from '../Graph'
import { Query, QueryLike, toQuery } from '../Query'
import { IDSourceNumber as IDSource } from '../utils/IDSource'
import { LooseMountPointSpec, resolveLooseMountPointSpec } from '../MountPoint'
import { Stream } from '../Stream'
import { get } from '../Item'
import { Port } from '../utils/Port'
import { Step } from '../Step'
import { Module } from '../Module'
import { randInt } from '../utils/rand'
import { UseConfig, ServeConfig, Message, QueryMessage, ConnectReply, StreamInputMessage } from './ProtocolCommon'

interface WebSocketServer {
    on(eventName: string, callback): void
}

export interface Config {
    graph: Graph
    use?: UseConfig
    serve?: ServeConfig
    singleConnection?: Port<Message,Message>
}

interface Connection {
    id: number
    port: Port<Message,Message>
    // connection: PortConnection
}

export class Server {
    graph: Graph
    config: Config
    nextConnectionId = new IDSource()
    nextStreamId = new IDSource()
    incomingInputStreams = new Map<number, Stream>()
    incomingOutputStreams = new Map<number, Stream>()

    // As server: have multiple connections, identified by ID.
    connections = new Map<number, Connection>()
    
    // As client: have a "single" connection to a server.
    singleConnection: Connection
    expectingConnectCid: number
    expectedModule: Module
    hostedModules = new Map<string, Module>()
    singleConnectionProviderId: string

    constructor(config: Config) {
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

            const provider = this.graph.addProvider((q: Query, i: Stream) => {
                return this.sendQueryToConnection(this.singleConnection, q, i)
            });

            this.singleConnectionProviderId = provider.provider_id;
        }

        if (this.config.use && this.config.use.discoverApi) {
            this.expectingConnectCid = randInt(1000000);

            this.singleConnection.port.postMessage({
                t: 'connect',
                cid: this.expectingConnectCid,
                discoverApi: this.config.use.discoverApi,
            });
        }

        if (this.config.use && this.config.use.expectedApi) {
            this.expectedModule = this.graph.mount(this.config.use.expectedApi.map((point: LooseMountPointSpec) => {
                point = resolveLooseMountPointSpec(point);
                return {
                    ...point,
                    run: (step) => {

                        const args = step.args();
                        const query = step.tuple.shallowCopy();

                        let connectionId;

                        if (this.config.use.connectionAttr) {
                            connectionId = get(args, this.config.use.connectionAttr);
                            query.deleteAttr(this.config.use.connectionAttr);
                        }

                        let connection: Connection;
                        if (connectionId) {
                            connection = this.connections.get(connectionId);
                        } else {
                            if (!this.singleConnection) {
                                throw new Error("Got a request with no connection attribute");
                            } else {
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
                }
            }));
        }
    }

    addWebSocketConnection(ws) {
        let id;

        const port: Port = {
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
        }

        id = this.addPortConnection(port);
    }

    addPortConnection(port: Port) {
        const id = this.nextConnectionId.take();

        const connection: Connection = { id, port };
        this.connections.set(id, connection);

        port.onMessage.addListener(message => {
            this.onMessage(connection, message);
        })

        return connection
    }

    setSingleConnection(port: Port) {
        const connection = { id: this.nextConnectionId.take(), port };
        this.singleConnection = connection;

        port.onMessage.addListener(message => {
            this.onMessage(connection, message);
        })

        return connection;
    }

    sendQueryToConnection(connection: Connection, queryLike: QueryLike, input: Stream) {
        let inputId = 0;
        const query = toQuery(queryLike);

        const outputId = this.nextStreamId.take();
        const output = new Stream();
        this.incomingOutputStreams.set(outputId, output);

        if (!input.isKnownEmpty())
            inputId = this.nextStreamId.take();

        const msg: QueryMessage = {
            t: 'query',
            query: query.toObject(),
            inputId,
            outputId,
        }

        connection.port.postMessage(msg);

        if (!input.isKnownEmpty()) {
            input.sendTo({
                receive: (msg) => {
                    const socketMsg: StreamInputMessage = {
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

    onMessage(connection: Connection, message: Message) {
        switch (message.t) {

        case 'connect':
            if (!this.config.serve) {
                connection.port.postMessage({
                    t: 'usageError',
                    message: 'connection is not set up as server',
                });
                return;
            }

            const reply: ConnectReply = {
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
                            run: (step: Step) => {
                                step.streaming();

                                this.sendQueryToConnection(this.singleConnection, step.tuple, step.input)
                                .sendTo(step.output);
                            }
                        }
                    });

                    const module = this.graph.mount(newPoints);
                    this.hostedModules.set(serverModuleEntry.id, module);
                }

                this.expectingConnectCid = 0;
                // this.status = 'open';

                return;
            }
            return;

        case 'updateModule':
            /*
            if (this.status === 'connecting')
                return;
            */

            console.log('unimp: updateModule');
            // TODO

            return;

        case 'query': {

            const parameters = {};

            if (message.inputId !== 0) {
                const stream = new Stream();
                parameters['$input'] = stream;
                this.incomingInputStreams.set(message.inputId, stream);
            }

            const query = Query.fromObject(message.query);
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

    warn(s: string) {
        console.warn('WSServer: ' + s);
    }
}

export function connectRemote(config: Config) {
    const connection = new Server(config);
    connection.start();
    return connection;
}

export function serverListenToWebSocket(server: Server, wsServer: WebSocketServer) {
    wsServer.on('connection', ws => {
        server.addWebSocketConnection(ws);
    });
}
