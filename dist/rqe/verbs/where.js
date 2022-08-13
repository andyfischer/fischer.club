"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.where = void 0;
const Item_1 = require("../Item");
function run(step) {
    const { input, output, tuple } = step;
    const args = step.args();
    input.transform(output, (item) => {
        for (const [key, value] of Object.entries(args)) {
            if (!(0, Item_1.has)(item, key))
                return [];
            const itemValue = (0, Item_1.get)(item, key);
            if (itemValue == null)
                return [];
            if (value != null && value != itemValue)
                return [];
        }
        return [item];
    });
}
exports.where = {
    run,
};
//# sourceMappingURL=where.js.map