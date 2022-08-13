"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rename = void 0;
const Item_1 = require("../Item");
function run(step) {
    const { tuple, input, output } = step;
    const args = step.args();
    input.transform(output, (item) => {
        if ((0, Item_1.has)(item, args.from)) {
            const val = (0, Item_1.get)(item, args.from);
            const updated = {
                ...item,
            };
            delete updated[args.from];
            updated[args.to] = val;
            return [updated];
        }
        else {
            return [item];
        }
    });
}
exports.rename = {
    run,
};
//# sourceMappingURL=rename.js.map