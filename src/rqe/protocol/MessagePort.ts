
import { Graph } from '../Graph'
import { IDSourceNumber as IDSource } from '../utils/IDSource'
import { Stream, StreamEvent, StreamReceiver } from '../Stream'
import { QueryLike, Query, toQuery } from '../Query'
import { SocketVerboseLog, StreamValidation } from '../config'
import { recordUnhandledException } from '../FailureTracking'
import { assertDataIsSerializable, wrapStreamInValidator, StreamProtocolValidator } from '../Debug'
import { closeWithResourceTag } from '../Listeners'
import { StreamsBridge } from '../socketv3/StreamsBridge'
import { toSerializable } from '../TaggedValue'
import { Port } from '../utils/Port'
import { captureExceptionAsErrorItem, ErrorItem } from '../Errors'

export interface Config {
    port: Port
    server?: {
        graph: Graph
        onQuery?: (query: Query) => void
    }
    client?: {
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


export class MessagePort {
    config: Config

    serverResourceTag: string

    // Streams active when this port is used as a server (which responds to queries)
    serverStreams = new StreamsBridge()

    // Streams active when this port is used as a client (which sends queries)
    clientStreams = new StreamsBridge()
    clientNextStreamId = new IDSource();

    isDisconnected = false

    constructor(config: Config) {
        this.config = config;
        if (this.config.server) {
            this.serverResourceTag = 'message-port-' + this.config.server.graph.nextResourceTag.take();
        }

        config.port.onMessage.addListener(msg => this.onMessage(msg));
        config.port.onDisconnect.addListener(() => this.disconnect());
    }

    disconnect() {
        this.isDisconnected = true;
        this.serverStreams.forceCloseAll({errorType: 'message_port_disconnect'});
        this.clientStreams.forceCloseAll({errorType: 'message_port_disconnect'});

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

                    this.config.port.postMessage(closeMsg);
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

                if (this.config.server.onQuery)
                    this.config.server.onQuery(query);

                if (params['$input'])
                    params['$input'] = this.serverStreams.startStream(params['$input']);

                const stream = this.config.server.graph.query(query, params, {
                    resourceTags: [this.serverResourceTag].concat(queryResourceTags),
                });

                stream.sendTo(
                    this.outgoingStream(msg.output)
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

                    this.config.port.postMessage(closeMsg);
                }
                break;
            }
        }
    }

    outgoingStream(outputStream: number): StreamReceiver {
        return {
            receive: (msg) => {
                assertDataIsSerializable(msg);

                const outputMsg: MessageToClient = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                }

                this.config.port.postMessage(outputMsg);
            }
        }
    }

    query(query: QueryLike, params: any = null, context: QueryContext = {}): Stream {
        if (!this.config.client)
            throw new Error("query() failed - MessagePort is not configured as client");

        if (this.isDisconnected)
            throw new Error("query() failed - MessagePort has disconnected");

        const outputStreamId = this.clientNextStreamId.take();
        const output = this.clientStreams.startStream(outputStreamId);

        const queryMsg: QueryMessage = {
            t: 'queryMsg',
            query: toSerializable(query) as QueryLike,
            params,
            output: outputStreamId,
        }

        this.config.port.postMessage(queryMsg);

        return output;
    }
}
