"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_query_with_provider = void 0;
const Runtime_1 = require("../Runtime");
function run(step) {
    const { tuple, input, output } = step;
    const { provider_id, query } = step.args();
    if (!query) {
        throw new Error("missing 'query'");
    }
    (0, Runtime_1.runQueryWithProvider)(step.graph, provider_id, query, input)
        .sendTo(output);
}
exports.run_query_with_provider = {
    run
};
//# sourceMappingURL=run_query_with_provider.js.map