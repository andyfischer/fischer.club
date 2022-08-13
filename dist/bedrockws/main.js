"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const IDSource_1 = require("../rqe/utils/IDSource");
const rqe_1 = require("../rqe");
const node_1 = require("../rqe/node");
const connections = (0, rqe_1.newTable)({
    funcs: [
        'id ->'
    ]
});
const nextRequestId = new IDSource_1.IDSource('request-');
function startSocketServer() {
    const wsserver = new ws_1.default.Server({
        port: 4300
    });
    const nextConnectionId = new IDSource_1.IDSource();
    wsserver.on('connection', ws => {
        const id = nextConnectionId.take();
        console.log(`received connection #${id}`);
        const send = (msg) => {
            ws.send(JSON.stringify(msg));
        };
        const onMessage = (evt) => {
            const msg = JSON.parse(evt.data);
            console.log('got message: ', msg);
        };
        const onClose = () => {
            console.log(`closed connection #${id}`);
            connections.delete({ id });
        };
        connections.put({ id, ws, send });
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
    });
    return wsserver;
}
const server = startSocketServer();
(0, rqe_1.func)('[v2] send $cmd', (cmd) => {
    let anyFound = null;
    for (const { send } of connections.scan()) {
        const requestId = nextRequestId.take();
        send({
            header: {
                requestId,
                messagePurpose: 'commandRequest',
                version: 1,
            },
            body: {
                commandLine: cmd,
                version: 1,
            }
        });
    }
});
(0, node_1.runCommandLineProcess)({
    startRepl: {
        prompt: 'bedrockws~ '
    }
});
//# sourceMappingURL=main.js.map