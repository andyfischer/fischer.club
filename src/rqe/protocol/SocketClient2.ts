
import { MessagePort, Config as MessagePortConfig } from './MessagePort'
import { recordUnhandledException } from '../FailureTracking'
import { LocalEventSource } from '../utils/Port'
import { IDSourceNumber as IDSource } from '../utils/IDSource'
import { StreamsBridge } from '../socketv3/StreamsBridge'
import { QueryLike, Query, toQuery } from '../Query'
import { Graph, Queryable } from '../Graph'
import { captureExceptionAsErrorItem, ErrorItem } from '../Errors'
import { Stream, StreamEvent, StreamReceiver } from '../Stream'
import { closeWithResourceTag } from '../Listeners'
import { assertDataIsSerializable, wrapStreamInValidator, StreamProtocolValidator } from '../Debug'
import { toSerializable } from '../TaggedValue'

interface WebSocket {
    addEventListener(name: string, callback: any): void
    send(msg: string): void
}

interface Options {
    client: {
        openConnection: () => WebSocket
    }
}

export interface InputMessage {
    t: 'inputMsg'
    stream: number
    msg: StreamEvent
}

export interface QueryMessage {
    t: 'queryMsg'
    query: QueryLike
    params: any
    output: number
    resourceTags?: string[]
}

export interface OutputMessage {
    t: 'outputMsg'
    stream: number
    msg: StreamEvent
}

export interface CloseInputStreamMessage {
    t: 'closeInputMsg'
    stream: number
    error: ErrorItem
}

export interface CloseOutputStreamMessage {
    t: 'closeOutputMsg'
    stream: number
    error: ErrorItem
}

interface QueryContext {
    resourceTags?: string[]
}

export type MessageToServer = InputMessage | QueryMessage | CloseInputStreamMessage
export type MessageToClient = OutputMessage | CloseOutputStreamMessage
export type Message = MessageToServer | MessageToClient

interface ConnectionConfig {
    postMessage(msg: MessageToServer | MessageToClient): void
    server?: {
        graph: Graph
    }
    client?: {
    }
}

export class Connection implements Queryable {
    config: ConnectionConfig

    isReady = false
    outgoingQueue: Message[] = []

    // Server state
    serverStreams = new StreamsBridge()
    serverResourceTag: string

    // Client state
    clientStreams = new StreamsBridge()
    clientNextStreamId = new IDSource();
    isDisconnected = false

    constructor(config: ConnectionConfig) {
        this.config = config;
    }

    disconnect(errorType: string = 'connection_disconnect') {
        this.isDisconnected = true;
        this.serverStreams.forceCloseAll({errorType});
        this.clientStreams.forceCloseAll({errorType});

        if (this.config.server) {
            closeWithResourceTag(this.config.server.graph, this.serverResourceTag);
        }
    }

    onMessage(msg) {
        switch (msg.t) {
            case 'inputMsg':
                if (!this.config.server)
                    throw new Error("on inputMsg - MessagePort wasn't configured as a server");
            
                try {
                    this.serverStreams.receiveMessage(msg.stream, msg.msg);
                } catch (e) {
                    const error = captureExceptionAsErrorItem(e);
                    const closeMsg: CloseInputStreamMessage = {
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

                // Add namespace isolation to any tags mentioned by the client.
                const queryResourceTags = (msg.resourceTags || [])
                    .map(tag => this.serverResourceTag + '-query-' + tag);

                query = toQuery(query);

                /*
                if (this.config.server.onQuery)
                    this.config.server.onQuery(query);
                    */

                if (params['$input'])
                    params['$input'] = this.serverStreams.startStream(params['$input']);

                const stream = this.config.server.graph.query(query, params, {
                    resourceTags: [this.serverResourceTag].concat(queryResourceTags),
                });

                stream.sendTo(
                    this.openStreamToClient(msg.output)
                );
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
                } catch (e) {
                    const error = captureExceptionAsErrorItem(e);
                    const closeMsg: CloseOutputStreamMessage= {
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

    openStreamToClient(outputStream: number): StreamReceiver {
        return {
            receive: (msg) => {
                assertDataIsSerializable(msg);

                const outputMsg: MessageToClient = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                }

                this.postMessage(outputMsg);
            }
        }
    }

    postMessage(msg: Message) {
        if (this.isReady) {
            try {
                this.config.postMessage(msg);
            } catch (e) {
                recordUnhandledException(e);
            }
        } else {
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

    query(query: QueryLike, params: any = null, context: QueryContext = {}): Stream {
        if (!this.config.client)
            throw new Error("query() failed - MessagePort is not configured as client");

        if (this.isDisconnected)
            throw new Error("query() failed - MessagePort has disconnected");

        // TODO: check if params has $input, if so then bridge that stream.
        
        const outputStreamId = this.clientNextStreamId.take();
        const output = this.clientStreams.startStream(outputStreamId);

        const queryMsg: QueryMessage = {
            t: 'queryMsg',
            query: toSerializable(query) as QueryLike,
            params,
            output: outputStreamId,
        }

        this.postMessage(queryMsg);

        return output;
    }
}

export class SocketClient2 implements Queryable {
    options: Options
    connection: Connection

    constructor(options: Options) {
        this.options = options;
    }

    createConnection() {
        const ws = this.options.client.openConnection();

        const config: ConnectionConfig = {
            postMessage(msg) {
                ws.send(JSON.stringify(msg));
            }
        }

        const connection = new Connection(config);

        ws.addEventListener('message', msg => {
            let parsed;
            try {
                parsed = JSON.parse(msg.data);
            } catch (e) {
                console.warn('Socket failed to parse JSON: ', msg.data);
                recordUnhandledException(e);
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

        // Disconnect existing connection (if any)
        if (this.connection) {
            try {
                this.connection.disconnect();
            } catch (e) {
                recordUnhandledException(e);
            }
        }

        this.connection = connection;
    }

    query(query: QueryLike, params: any = null, context: QueryContext = {}): Stream {
        if (!this.connection || this.connection.isDisconnected)
            this.createConnection();

        return this.connection.query(query, params, context);
    }
}
