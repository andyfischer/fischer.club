
import { Graph } from '../Graph'
import { IDSourceNumber as IDSource } from '../utils/IDSource'
import { Stream, StreamEvent, StreamReceiver } from '../Stream'
import { QueryLike, Query, toQuery } from '../Query'
import { SocketVerboseLog, StreamValidation } from '../config'
import { recordUnhandledException } from '../FailureTracking'
import { assertDataIsSerializable, wrapStreamInValidator, StreamProtocolValidator } from '../Debug'
import { closeWithResourceTag } from '../Listeners'
import { StreamsBridge } from '../socketv3/StreamsBridge'
import { captureExceptionAsErrorItem, ErrorItem } from '../Errors'

interface ServerOptions {
    graph: Graph
    wsServer: any
    onConnection?: (connection: Connection) => void
    onQuery?: (connection: Connection, query: Query) => void
    onListen?: (connection: Connection, query: Query) => void
    requireAuth?: boolean
    checkAuthKey?: (key: string) => boolean | Promise<boolean>
}

interface InputMessage {
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

interface OutputMessage {
    t: 'outputMsg'
    stream: number
    msg: StreamEvent
}

export interface CloseStreamMessage {
    t: 'closeStreamMsg'
    stream: number
    error: ErrorItem
}

export type MessageToServer = InputMessage | QueryMessage | CloseStreamMessage
export type MessageToClient = OutputMessage | CloseStreamMessage

class Connection {
    ws: any
    hasAuthenticated: boolean
    state: any

    constructor(ws) {
        this.ws = ws;
    }
}

async function socketLevelQuery(server: SocketServer, conn: Connection, query: Query, params): Promise<{ stream: Stream} | null> {

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
            return {stream: Stream.errorToStream({
                errorType: 'auth_failed',
                message: "server has no .checkAuthKey handler"
            })}
        }

        const key = params.key;
        const success = await server.options.checkAuthKey(key);

        if (success) {
            conn.hasAuthenticated = true;
            return { stream: Stream.fromList([]) }
        }

        return { stream: Stream.errorToStream({
            errorType: 'auth_failed',
            message: "invalid key",
        })}
    }

    return null;
}

export class SocketServer {

    incomingStreams = new StreamsBridge();
    nextConnectionId = new IDSource();
    options: ServerOptions
    graph: Graph

    constructor(options: ServerOptions) {
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

        let onMessage = async (msg: { data: string }) => {
            if (SocketVerboseLog)
                console.log('socket received: ' + msg.data);

            const parsed: MessageToServer = JSON.parse(msg.data);

            switch (parsed.t) {

            case 'inputMsg':
                try {
                    this.incomingStreams.receiveMessage(parsed.stream, parsed.msg);
                } catch (e) {
                    const error = captureExceptionAsErrorItem(e);
                    const closeMsg: CloseStreamMessage = {
                        t: 'closeStreamMsg',
                        stream: parsed.stream,
                        error,
                    };

                    const jsonMsg = JSON.stringify(closeMsg);
                    if (SocketVerboseLog)
                        console.log('SocketServer send: ' + jsonMsg);

                    conn.ws.send(jsonMsg);
                }
                return;

            case 'queryMsg': {
                let query = parsed.query;
                const params = parsed.params || {};

                // Add namespace isolation to any tags mentioned by the client.
                const queryResourceTags = (parsed.resourceTags || [])
                    .map(tag => socketResourceTag + '-query-' + tag);

                query = toQuery(query);

                if (this.options.onQuery) {
                    try {
                        this.options.onQuery(conn, query);
                    } catch (e) {
                        recordUnhandledException(e, this.graph);
                    }
                }

                // Handle a socket-level query.
                let output = await socketLevelQuery(this, conn, query, params);

                if (output) {
                    output.stream.sendTo(this.outgoingStream(conn, parsed.output));
                    return;
                }

                // Reject if unauthenticated
                if (this.options.requireAuth && !conn.hasAuthenticated) {
                    Stream.errorToStream({errorType: 'protocol_error_need_to_authenticate' })
                    .sendTo(this.outgoingStream(conn, parsed.output));

                    return;
                }

                // Fully handle query
                if (params['$input'])
                    params['$input'] = this.incomingStreams.startStream(params['$input']);

                const stream = this.graph.query(query, params, {
                    socketConnection: conn,
                    resourceTags: [socketResourceTag].concat(queryResourceTags),
                });

                // console.log(`query (${query.toQueryString()}) has output stream:` + stream.getDebugLabel());

                stream.sendTo(
                    this.outgoingStream(conn, parsed.output)
                );

                return;
            }

            case 'closeStreamMsg':
                this.incomingStreams.forceClose(parsed.stream, parsed.error);
                break;
            }
        };

        let onClose = () => {
            closeWithResourceTag(this.graph, socketResourceTag);
        };

        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
    }

    outgoingStream(conn: Connection, outputStream: number): StreamReceiver {
        return {
            receive: (msg) => {
                assertDataIsSerializable(msg);

                const outputMsg: MessageToClient = {
                    t: 'outputMsg',
                    stream: outputStream,
                    msg,
                }

                const jsonMsg = JSON.stringify(outputMsg);
                if (SocketVerboseLog)
                    console.log('SocketServer send: ' + jsonMsg);

                conn.ws.send(jsonMsg);
            }
        }
    }
}

