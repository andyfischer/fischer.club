
import { ConnectionProtocol, Message, ProtocolReadyState } from './Connection'
import { LocalEventSource } from '../utils/Port'

interface WebSocket {
    addEventListener(name: string, callback: any): void
    removeEventListener(name: string, callback: any): void
    send(msg: string): void
}

interface Config {
    openSocket(): WebSocket
}
 
function getRetryDelay(attempts) {
    switch (attempts) {
    case 1:
        return 100;
    case 2:
        return 200;
    case 3:
        return 500;
    case 4:
        return 1000;
    case 5:
    default:
        return 2000;
    }
}

const MaxConnectAttepts = 5;

export class WebSocketClient implements ConnectionProtocol {

    config: Config
    readyState: ProtocolReadyState

    ws: WebSocket

    onReadyStateChange = new LocalEventSource()
    onMessage = new LocalEventSource()

    connectFailedRetryCount = 0
    reconnectTimer: any

    constructor(config: Config) {
        this.config = config;
    }

    prepare() {
        if (!this.ws)
            this.openSocket();
    }

    openSocket() {
        if (this.ws) {
            console.error("WebSocketClient logic error - already have .ws in openSocket");
        }

        const ws = this.config.openSocket();
        let closed = false;

        const onMessage = (evt) => {
            if (closed)
                return;

            const parsed = JSON.parse(evt.data);
            this.onMessage.emit(parsed);
        }

        const onOpen = () => {
            if (closed)
                return;

            this.connectFailedRetryCount = 0;
            this.setReadyState('ready')
        }

        const onError = (err) => {
            if (closed)
                return;

             this.setReadyState('not_ready');

            removeListeners();
            closed = true;
            this.ws = null;

            this.onConnectFailed();
        }

        const onClose = () => {
            if (closed)
                return;

            this.setReadyState('not_ready');

            removeListeners();
            closed = true;
            this.ws = null;
        }

        const removeListeners = () => {
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('open', onOpen);
            ws.removeEventListener('error', onError);
            ws.removeEventListener('close', onClose);
        }

        ws.addEventListener('message', onMessage);
        ws.addEventListener('open', onOpen);
        ws.addEventListener('error', onError);
        ws.addEventListener('close', onClose);

        this.ws = ws;
    }

    setReadyState(state: ProtocolReadyState) {
        this.readyState = state;
        this.onReadyStateChange.emit(state);
    }

    send(msg: Message) {
        if (this.readyState === 'not_ready') {
            throw new Error("Connection error: called send() but the client is not ready");
        }

        this.ws.send(JSON.stringify(msg));
    }

    onConnectFailed() {
        this.connectFailedRetryCount++;

        if (this.connectFailedRetryCount > MaxConnectAttepts) {
            this.setReadyState('failed');
        } else {
            if (!this.reconnectTimer) {
                this.reconnectTimer = setTimeout(() => {
                    this.reconnectTimer = null;
                    this.openSocket();
                }, getRetryDelay(this.connectFailedRetryCount));
            }
        }
    }
}
