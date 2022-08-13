
import { Graph } from '../Graph'
import { IDSourceNumber as IDSource } from '../utils/IDSource'
import { Stream } from '../Stream'
import { QueryLike } from '../Query'
import { SocketVerboseLog } from '../config'
import { captureExceptionAsErrorItem } from '../Errors'
import { consoleLogError } from '../format/terminal/consoleOutput'
import { QueryMessage, MessageToClient, CloseStreamMessage } from './SocketServer'
import { StreamsBridge } from '../socketv3/StreamsBridge'
import { MountPointSpec } from '../MountPoint'
import { parseTableDecl } from '../parser/parseTableDecl'
import { Step } from '../Step'
import { toSerializable } from '../TaggedValue'
import { assertDataIsSerializable } from '../Debug'

interface ClientOptions {
    ws: any
    authenticationKey?: string
}

interface QueryContext {
    skipQueue?: boolean
    resourceTags?: string[]
}

export class SocketClient {
    nextStreamId = new IDSource();
    incomingStreams = new StreamsBridge();
    isOpen: boolean = false
    options: ClientOptions
    outgoingQueue: QueryMessage[] = []
    ws: any

    constructor(options: ClientOptions) {
        this.ws = options.ws;
        this.options = options;

        const onMessage = (msg: { data: string }) => {
            if (SocketVerboseLog)
                console.log('SocketClient received: ' + msg.data);
            const parsed: MessageToClient = JSON.parse(msg.data);

            switch (parsed.t) {
            case 'outputMsg':
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
                        console.log('SocketClient send: ' + jsonMsg);

                    this.ws.send(jsonMsg);
                }
            
                break;
            case 'closeStreamMsg':
                this.incomingStreams.forceClose(parsed.stream, parsed.error);
                break;
            }
        }

        const onOpen = () => {
            if (this.options.authenticationKey) {
                this.query('socket-protocol authenticate $key', { key: this.options.authenticationKey }, { skipQueue: true })
                .then(() => {
                    this.setOpenAndSendQueue();
                });
            } else {
                this.setOpenAndSendQueue();
            }
        }

        const onError = (e) => {
            const error = captureExceptionAsErrorItem(e);
            error.errorType = 'socket_protocol_error';
            consoleLogError(error);

            this.incomingStreams.forceCloseAll(error);
        }

        const onClose = () => {
            this.incomingStreams.forceCloseAll({ errorType: 'socket_closed' });
        }

        this.ws.addEventListener('message', onMessage);
        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);
        this.ws.addEventListener('close', onClose);
    }

    setOpenAndSendQueue() {
        for (const msg of this.outgoingQueue) {
            assertDataIsSerializable(msg);
            this.ws.send(JSON.stringify(msg));
        }

        this.outgoingQueue = [];
        this.isOpen = true;
    }

    query(query: QueryLike, params: any = null, context: QueryContext = {}): Stream {

        const outputStreamId = this.nextStreamId.take();
        const output = this.incomingStreams.startStream(outputStreamId);
        const skipQueue = context?.skipQueue;

        const queryMsg: QueryMessage = {
            t: 'queryMsg',
            query: toSerializable(query) as QueryLike,
            params,
            output: outputStreamId,
            resourceTags: context?.resourceTags,
        }

        if (this.isOpen || skipQueue) {
            assertDataIsSerializable(queryMsg);
            this.ws.send(JSON.stringify(queryMsg));
        } else {
            this.outgoingQueue.push(queryMsg);
        }

        return output;
    }
}

interface ManagedSocketClientOptions {
    openSocket: () => any
    authenticationKey?: string
}

export class ManagedSocketClient {
    socket: SocketClient
    options: ManagedSocketClientOptions

    constructor(options: ManagedSocketClientOptions) {
        this.options = options;
    }

    query(query: QueryLike, params: any = null): Stream {
        if (!this.socket) {
            const ws = this.options.openSocket();
            this.socket = new SocketClient({
                ws,
                authenticationKey: this.options.authenticationKey,
            });
            if (SocketVerboseLog) {
                console.log('ManagedSocketClient opened socket');
            }
        }

        return this.socket.query(query, params);
    }

    serveFunc(decl: string): MountPointSpec {

        // still TODO
        
        const mount = parseTableDecl(decl);

        return {
            ...mount,
            run(task: Step) {}
        }
    }
}
