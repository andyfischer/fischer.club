"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTable = void 0;
const _1 = require(".");
function toTable(tableLike) {
    if (Array.isArray(tableLike)) {
        const table = new _1.Table({});
        table.putItems(tableLike);
        return table;
    }
    return tableLike;
}
exports.toTable = toTable;
//# sourceMappingURL=toTable.js.map