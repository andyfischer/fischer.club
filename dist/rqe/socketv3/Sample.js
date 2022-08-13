"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSampleSocket = void 0;
const Connection_1 = require("./Connection");
const WebSocketClient_1 = require("./WebSocketClient");
function startSampleSocket() {
    const connection = new Connection_1.Connection({
        protocol: new WebSocketClient_1.WebSocketClient({
            openSocket() {
                return new WebSocket('ws://localhost:4000');
            }
        }),
        client: {},
    });
}
exports.startSampleSocket = startSampleSocket;
//# sourceMappingURL=Sample.js.map