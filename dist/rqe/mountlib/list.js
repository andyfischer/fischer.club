"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListMount = void 0;
const Table_1 = require("../Table");
const table_1 = require("./table");
function getEffectiveAttrs(items) {
    const attrs = {};
    for (const item of items) {
        for (const key of Object.keys(item))
            attrs[key] = true;
    }
    return Object.keys(attrs);
}
function getListMount(config) {
    const { items } = config;
    let attrs = config.attrs;
    if (!attrs) {
        attrs = {};
        for (const attr of getEffectiveAttrs(items)) {
            attrs[attr] = {};
        }
    }
    const table = new Table_1.Table({ attrs });
    for (const item of config.items)
        table.put(item);
    return (0, table_1.getTableMount)(table);
}
exports.getListMount = getListMount;
//# sourceMappingURL=list.js.map