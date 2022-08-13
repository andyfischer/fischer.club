"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.order_by = void 0;
const Item_1 = require("../Item");
function run(step) {
    const { input, output } = step;
    const args = step.argsQuery();
    function getSortKey(item) {
        const items = [];
        for (const tag of args.tags)
            items.push((0, Item_1.get)(item, tag.attr));
        return items.join(' ');
    }
    input.aggregate(output, (items) => {
        items.sort((a, b) => {
            return getSortKey(a).localeCompare(getSortKey(b));
        });
        return items;
    });
}
exports.order_by = {
    run,
};
//# sourceMappingURL=order_by.js.map