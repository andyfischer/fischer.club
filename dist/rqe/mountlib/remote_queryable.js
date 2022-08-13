"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRemoteQueryable = exports.forwardToRemote = void 0;
const parseTableDecl_1 = require("../parser/parseTableDecl");
function forwardToRemote(step, options) {
    let tuple = step.tuple;
    if (options.queryModifier)
        tuple = tuple.getRelated(options.queryModifier);
    const output = options.graph.query(tuple, null);
    output.sendTo(step.output);
    step.streaming();
}
exports.forwardToRemote = forwardToRemote;
function setupRemoteQueryable(decl, options) {
    const mountSpec = (0, parseTableDecl_1.parseTableDecl)(decl);
    const graph = options.graph;
    if (!graph)
        throw new Error('missing: graph');
    mountSpec.run = (step) => {
        forwardToRemote(step, options);
    };
    return mountSpec;
}
exports.setupRemoteQueryable = setupRemoteQueryable;
//# sourceMappingURL=remote_queryable.js.map