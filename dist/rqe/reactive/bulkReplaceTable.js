"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkReplaceTable = void 0;
const Stream_1 = require("../Stream");
function bulkReplaceTable(destination) {
    const stream = new Stream_1.Stream();
    const items = [];
    stream.sendTo({
        receive(msg) {
            switch (msg.t) {
                case 'item':
                    items.push(msg.item);
                    break;
                case 'done':
                    destination.deleteAll();
                    for (const item of items)
                        destination.put(item);
                    break;
            }
        }
    });
    return stream;
}
exports.bulkReplaceTable = bulkReplaceTable;
//# sourceMappingURL=bulkReplaceTable.js.map