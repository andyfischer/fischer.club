/*
 Connection

 Keeps track of the persisted state for a connection. This includes any active bridged streams.

 A connection can run in:
  - Client mode (sends queries)
  - Server mode (handles queries using a Graph)
  - Both client and server

 Other responsibilities:
  - Listens to the protocol's onReadyStateChange, and keeps outgoing queries in a queue
    if the protocol is not ready.
 */

import { recordUnhandledException } from '../FailureTracking'
import { LocalEventSource } from '../utils/Port'
import { IDSourceNumber as IDSource } from '../utils/IDSource'
import { StreamsBridge } from './StreamsBridge'
import { QueryLike, Query, toQuery, QueryParameters } from '../Query'
import { Graph, Queryable } from '../Graph'
import { captureExceptionAsErrorItem, ErrorItem } from '../Errors'
import { Stream, StreamEvent, StreamReceiver } from '../Stream'
import { closeWithResourceTag } from '../Listeners'
import { assertDataIsSerializable, wrapStreamInValidator, StreamProtocolValidator } from '../Debug'
import { toSerializable } from '../TaggedValue'
import { EventSource } from '../utils/Port'

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

interface ConnectionConfig {
    protocol: ConnectionProtocol
    onReady?: (conn: Connection) => void
    server?: {
        graph: Graph
    }
    client?: {
    }
}

interface QueryContext {
    resourceTags?: string[]
}

export type MessageToServer = InputMessage | QueryMessage | CloseInputStreamMessage
export type MessageToClient = OutputMessage | CloseOutputStreamMessage
export type Message = MessageToServer | MessageToClient

export interface ConnectionProtocol {
    onReadyStateChange: EventSource
    onMessage: EventSource
    prepare(): void
    send(msg: Message): void
}

export type ProtocolReadyState =
    'ready' // Ready state: The connection is open and can send messages.
    | 'not_ready' // Not ready: The connection is being created or maybe a reconnect is in progress. Messages will be queued.
    | 'failed'    // Failed: The protocol gave up. All queries will result in an error.

interface OutgoingQuery {
    query: QueryLike
    params: QueryParameters
    outputStreamId: number
}

export class Connection implements Queryable {
    config: ConnectionConfig

    // Protocol state
    protocolReadyState: ProtocolReadyState = 'not_ready'
    outgoingQueue: OutgoingQuery[] = []

    // Server state
    serverStreams = new StreamsBridge()
    serverResourceTag: string

    // Client state
    clientStreams = new StreamsBridge()
    clientNextStreamId = new IDSource();

    constructor(config: ConnectionConfig) {
        this.config = config;

        this.config.protocol.onReadyStateChange.addListener((state) => this.onProtocolReadyStateChange(state));
        this.config.protocol.onMessage.addListener((msg) => this.onMessage(msg));

        if (config.server) {
            this.serverResourceTag = 'socket-' + this.config.server.graph.nextResourceTag.take();
        }
    }

    disconnect(errorType: string = 'connection_disconnect') {
        this.serverStreams.forceCloseAll({errorType});
        this.clientStreams.forceCloseAll({errorType});

        if (this.config.server) {
            closeWithResourceTag(this.config.server.graph, this.serverResourceTag);
        }
    }

    onProtocolReadyStateChange(state: ProtocolReadyState) {
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
                } catch (e) {
                    const error = captureExceptionAsErrorItem(e);
                    const closeMsg: CloseInputStreamMessage = {
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
                    throw new Error("on outputMsg - Connection wasn't configured as a client");

                try {
                    this.clientStreams.receiveMessage(msg.stream, msg.msg);
                } catch (e) {
                    const error = captureExceptionAsErrorItem(e);
                    const closeMsg: CloseOutputStreamMessage= {
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

    openStreamToClient(outputStream: number): StreamReceiver {
        return {
            receive: (msg) => {
                assertDataIsSerializable(msg);

                const outputMsg: MessageToClient = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                }

                this.send(outputMsg);
            }
        }
    }

    send(msg: Message) {
        try {
            this.config.protocol.send(msg);
        } catch (e) {
            recordUnhandledException(e);
        }
    }

    query(query: QueryLike, params: any = null, context: QueryContext = {}): Stream {
        if (!this.config.client)
            throw new Error("query() failed - Connection is not configured as client");

        if (this.protocolReadyState === 'failed') {
            const output = new Stream();
            output.forceClose({ errorType: 'connection_failed' });
            return output;
        }

        // TODO: check if params has $input, if so then bridge that stream.
        if (params && params['$input'])
            throw new Error("not yet supported: $input param");
        
        const outputStreamId = this.clientNextStreamId.take();
        const output = this.clientStreams.startStream(outputStreamId);

        const outgoing: OutgoingQuery = { query, params, outputStreamId };

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

    sendQuery(outgoing: OutgoingQuery) {
        const queryMsg: QueryMessage = {
            t: 'queryMsg',
            query: toSerializable(outgoing.query) as QueryLike,
            params: outgoing.params,
            output: outgoing.outputStreamId,
        }

        this.send(queryMsg);
    }
}
