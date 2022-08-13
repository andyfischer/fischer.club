"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketServer = void 0;
const http_1 = __importDefault(require("http"));
const SocketServer_1 = require("../../protocol/SocketServer");
function createSocketServer(options) {
    const server = http_1.default.createServer();
    const wsServer = new options.ws.Server({
        server: server
    });
    const rqeSocketServer = new SocketServer_1.SocketServer({
        graph: options.graph,
        wsServer: wsServer,
        onQuery: (conn, query) => {
            if (options.onQuery)
                options.onQuery(conn, query);
        },
        onConnection: () => {
            if (options.onConnection)
                options.onConnection();
        },
    });
    server.listen(options.port);
    if (options.onListen)
        options.onListen(options.port);
    return server;
}
exports.createSocketServer = createSocketServer;
//# sourceMappingURL=WebSocketServer.js.map