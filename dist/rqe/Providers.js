"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newProviderTable = void 0;
function newProviderTable(graph) {
    return graph.newTable({
        attrs: {
            provider_id: { generate: { method: 'increment', prefix: 'provider-' } },
            runQuery: {},
        },
    });
}
exports.newProviderTable = newProviderTable;
//# sourceMappingURL=Providers.js.map