"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Item_1 = require("../Item");
function where(item, step) {
    for (const [key, value] of Object.entries(step.args)) {
        if (!(0, Item_1.has)(item, key))
            return [];
        if (value != null && value != (0, Item_1.get)(item, key))
            return [];
    }
    return [item];
}
const def = {
    func: where
};
exports.default = def;
//# sourceMappingURL=where.js.map