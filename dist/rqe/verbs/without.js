"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.without = void 0;
const Item_1 = require("../Item");
function run(step) {
    const { input, output } = step;
    const args = step.argsQuery();
    input.transform(output, (item) => {
        const out = {};
        for (const [key, value] of (0, Item_1.entries)(item)) {
            if (!args.has(key))
                out[key] = value;
        }
        return [out];
    });
}
exports.without = {
    run,
};
//# sourceMappingURL=without.js.map