"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count_by = void 0;
const Item_1 = require("../Item");
class ItemPartition {
    constructor(attrs) {
        this.attrs = attrs;
    }
    getKey(item) {
        const out = [];
        for (const attr of this.attrs)
            out.push((0, Item_1.get)(item, attr));
        return JSON.stringify(out);
    }
}
function run(step) {
    const { input, output } = step;
    const args = step.argsQuery();
    const keyer = new ItemPartition(args.tags.map(tag => tag.attr));
    input.aggregate(output, (items) => {
        const counts = new Map();
        for (const item of items) {
            const key = keyer.getKey(item);
            if (!counts.has(key))
                counts.set(key, 1);
            else
                counts.set(key, counts.get(key) + 1);
        }
        const result = [];
        for (const [key, count] of counts) {
            const items = JSON.parse(key);
            const out = {};
            for (let i = 0; i < keyer.attrs.length; i++) {
                const attr = keyer.attrs[i];
                out[attr] = items[i];
            }
            out['count'] = count;
            result.push(out);
        }
        return result;
    });
}
exports.count_by = {
    run,
};
//# sourceMappingURL=count_by.js.map