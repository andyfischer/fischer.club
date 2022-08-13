"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeConnectFromSubprocess = void 0;
const globalGraph_1 = require("../globalGraph");
const activeMountsById = new Map();
let _hasConnectedViaIPC = false;
function maybeConnectFromSubprocess() {
    if (!process.env.RQE_SUBPROCESS)
        return;
    if (_hasConnectedViaIPC)
        return;
    if (!process.send)
        throw new Error("didn't find a Node IPC channel");
    const graph = (0, globalGraph_1.getGraph)();
    process.on('message', (msg) => {
        switch (msg.t) {
            case 'query':
                const { query, input, output } = msg;
                const outputStream = graph.query(query);
                outputStream.sendTo({
                    receive(streamMsg) {
                        const outgoing = {
                            t: 'output',
                            streamId: output,
                            msg: streamMsg,
                        };
                        process.send(outgoing);
                    }
                });
                break;
        }
    });
    _hasConnectedViaIPC = true;
    graph.addSchemaListener(event => {
        switch (event.verb) {
            case 'update':
                const outgoing = {
                    t: 'updateModule',
                    id: event.item.id,
                    pointSpecs: event.item.points.map(point => point.spec),
                };
                process.send(outgoing);
                break;
        }
    }, { backlog: true });
}
exports.maybeConnectFromSubprocess = maybeConnectFromSubprocess;
//# sourceMappingURL=SubprocessDeclare.js.map