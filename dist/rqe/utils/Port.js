"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalPortPair = exports.portErrorWrap = exports.LocalEventSource = void 0;
const Debug_1 = require("../Debug");
class LocalEventSource {
    constructor() {
        this.listeners = [];
    }
    addListener(callback) {
        this.listeners.push(callback);
    }
    removeListener(callback) {
        this.listeners = this.listeners.filter(c => c !== callback);
    }
    emit(msg = null) {
        for (const listener of this.listeners) {
            try {
                listener(msg);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}
exports.LocalEventSource = LocalEventSource;
function portErrorWrap(port, onPortError) {
    return {
        postMessage(msg) {
            try {
                port.postMessage(msg);
            }
            catch (e) {
                onPortError(e);
            }
        },
        disconnect() {
            port.disconnect();
        },
        onMessage: port.onMessage,
        onDisconnect: port.onDisconnect,
    };
}
exports.portErrorWrap = portErrorWrap;
class LocalPort {
    constructor(getPair) {
        this.onMessage = new LocalEventSource();
        this.onDisconnect = new LocalEventSource();
        this.disconnected = false;
        this.getPair = getPair;
    }
    postMessage(msg) {
        (0, Debug_1.assertDataIsSerializable)(msg);
        msg = JSON.parse(JSON.stringify(msg));
        if (this.disconnected)
            throw new Error('disconnected');
        this.getPair().onMessage.emit(msg);
    }
    disconnect() {
        this.getPair().onDisconnect.emit();
        this.disconnected = true;
        delete this.onMessage;
        delete this.onDisconnect;
    }
}
function createLocalPortPair() {
    let clientToServer;
    let serverToClient;
    clientToServer = new LocalPort(() => serverToClient);
    serverToClient = new LocalPort(() => clientToServer);
    return [clientToServer, serverToClient];
}
exports.createLocalPortPair = createLocalPortPair;
//# sourceMappingURL=Port.js.map