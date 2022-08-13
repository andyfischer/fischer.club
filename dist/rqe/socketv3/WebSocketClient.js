"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
const Port_1 = require("../utils/Port");
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
class WebSocketClient {
    constructor(config) {
        this.onReadyStateChange = new Port_1.LocalEventSource();
        this.onMessage = new Port_1.LocalEventSource();
        this.connectFailedRetryCount = 0;
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
        };
        const onOpen = () => {
            if (closed)
                return;
            this.connectFailedRetryCount = 0;
            this.setReadyState('ready');
        };
        const onError = (err) => {
            if (closed)
                return;
            this.setReadyState('not_ready');
            removeListeners();
            closed = true;
            this.ws = null;
            this.onConnectFailed();
        };
        const onClose = () => {
            if (closed)
                return;
            this.setReadyState('not_ready');
            removeListeners();
            closed = true;
            this.ws = null;
        };
        const removeListeners = () => {
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('open', onOpen);
            ws.removeEventListener('error', onError);
            ws.removeEventListener('close', onClose);
        };
        ws.addEventListener('message', onMessage);
        ws.addEventListener('open', onOpen);
        ws.addEventListener('error', onError);
        ws.addEventListener('close', onClose);
        this.ws = ws;
    }
    setReadyState(state) {
        this.readyState = state;
        this.onReadyStateChange.emit(state);
    }
    send(msg) {
        if (this.readyState === 'not_ready') {
            throw new Error("Connection error: called send() but the client is not ready");
        }
        this.ws.send(JSON.stringify(msg));
    }
    onConnectFailed() {
        this.connectFailedRetryCount++;
        if (this.connectFailedRetryCount > MaxConnectAttepts) {
            this.setReadyState('failed');
        }
        else {
            if (!this.reconnectTimer) {
                this.reconnectTimer = setTimeout(() => {
                    this.reconnectTimer = null;
                    this.openSocket();
                }, getRetryDelay(this.connectFailedRetryCount));
            }
        }
    }
}
exports.WebSocketClient = WebSocketClient;
//# sourceMappingURL=WebSocketClient.js.map