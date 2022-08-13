"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCacher = void 0;
const parseTableDecl_1 = require("../parser/parseTableDecl");
const Enums_1 = require("../Enums");
function setupCacher(decl, options) {
    const table = options.table || options.graph.builtins.funcCache();
    const mountSpec = (0, parseTableDecl_1.parseTableDecl)(decl);
    const func_key = decl;
    const queryModifier = options.queryModifier || { with: 'no-cache' };
    mountSpec.run = (step) => {
        step.async();
        const input_tuple_str = step.tuple.toQueryString();
        const found = table.one({ input_tuple: input_tuple_str });
        if (found) {
            for (const event of found.output_stream) {
                step.output.receive(event);
            }
            return;
        }
        const eventsToCache = [];
        step.queryRelated(queryModifier)
            .sendTo({
            receive(msg) {
                eventsToCache.push(msg);
                if (msg.t === Enums_1.c_done) {
                    table.put({
                        func: func_key,
                        input_tuple: input_tuple_str,
                        output_stream: eventsToCache,
                        cached_at: (new Date()).toISOString(),
                    });
                }
                step.output.receive(msg);
            }
        });
    };
    return mountSpec;
}
exports.setupCacher = setupCacher;
//# sourceMappingURL=cacher.js.map