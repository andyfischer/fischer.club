"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.just = void 0;
const Item_1 = require("../Item");
function run(step) {
    const { tuple, input, output } = step;
    const args = step.args();
    input.transform(output, (item) => {
        const out = {};
        for (const [key, value] of (0, Item_1.entries)(item)) {
            if ((0, Item_1.has)(args, key))
                out[key] = value;
        }
        return [out];
    });
}
exports.just = {
    run,
};
//# sourceMappingURL=just.js.map