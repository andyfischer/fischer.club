"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDebouncedTable = void 0;
const changePropogation_1 = require("./changePropogation");
const distributedTable_1 = require("./distributedTable");
function newDebouncedTable(graph, table, delayMs = 0) {
    const baseSchema = table.schema;
    const schema = {
        ...baseSchema,
        name: baseSchema.name + '/debounce'
    };
    const debounced = graph.newTable(schema);
    (0, distributedTable_1.connectDistributedTable)({
        graph,
        source: table,
        delayToSyncMs: delayMs,
        onOutgoingData(changes) {
            (0, changePropogation_1.applyChangeList)(changes, debounced);
        }
    });
    return debounced;
}
exports.newDebouncedTable = newDebouncedTable;
//# sourceMappingURL=debounced.js.map