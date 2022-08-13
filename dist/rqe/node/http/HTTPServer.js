"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpServer = void 0;
const http = __importStar(require("http"));
const globalGraph_1 = require("../../globalGraph");
const http_routes = (0, globalGraph_1.newTable)({
    mount: true,
    name: 'http_routes',
    attrs: {
        http_server: {},
        path: {},
        request_handler: {},
    },
    indexes: [{
            attrs: ['path']
        }]
});
function createHttpServer(graph) {
    const server = http.createServer(async (request, response) => {
        try {
            console.log(request.method, request.url);
            const pathHandler = (await graph.query({
                attrs: { http_server: null, request_handler: null, path: request.url }
            })).one();
            if (pathHandler) {
                pathHandler.request_handler(request, response);
                return;
            }
            response.writeHead(404);
            response.end("not found");
        }
        catch (e) {
            response.writeHead(500);
            console.error(e);
            response.end("internal error while handling: " + request.url);
        }
    });
    const port = 8000;
    server.listen(port);
    console.log("Listening on: " + 8000);
    return { http_routes, server };
}
exports.createHttpServer = createHttpServer;
if (require.main === module) {
    createHttpServer((0, globalGraph_1.getGraph)());
}
//# sourceMappingURL=HTTPServer.js.map