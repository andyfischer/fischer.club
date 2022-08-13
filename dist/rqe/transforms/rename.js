"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Item_1 = require("../Item");
function rename(item, step) {
    const from = step.from;
    const to = step.to;
    if ((0, Item_1.has)(item, from)) {
        const val = (0, Item_1.get)(item, from);
        const updated = {
            ...item,
        };
        delete updated[from];
        updated[to] = val;
        return [updated];
    }
    else {
        return [item];
    }
}
const def = {
    func: rename
};
exports.default = def;
//# sourceMappingURL=rename.js.map