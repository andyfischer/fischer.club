"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkProjectedRows = void 0;
const Query_1 = require("../Query");
const Transform_1 = require("../Transform");
const Enums_1 = require("../Enums");
function linkProjectedRows(graph, fromTable, queryLike, toTable) {
    const query = (0, Query_1.toQuery)(queryLike, { graph, expectTransform: true });
    (0, Transform_1.applyTransform)(graph, fromTable.list(), query)
        .sendTo({
        receive(msg) {
            switch (msg.t) {
                case Enums_1.c_item:
                    toTable.put(msg.item);
            }
        }
    });
    fromTable.addChangeListener(evt => {
        if (evt.verb === 'put') {
            (0, Transform_1.applyTransform)(graph, [evt.item], query)
                .sendTo({
                receive(msg) {
                    switch (msg.t) {
                        case Enums_1.c_item:
                            toTable.put(msg.item);
                    }
                }
            });
        }
        else if (evt.verb === 'delete') {
            (0, Transform_1.applyTransform)(graph, [evt.item], query)
                .sendTo({
                receive(msg) {
                    switch (msg.t) {
                        case Enums_1.c_item:
                            toTable.delete(msg.item);
                    }
                }
            });
        }
    });
}
exports.linkProjectedRows = linkProjectedRows;
//# sourceMappingURL=projectedRows.js.map