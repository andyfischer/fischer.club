"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = void 0;
function groupBy(it, keyFn) {
    const map = new Map();
    for (const item of it) {
        const key = keyFn(item);
        if (map.has(key))
            map.get(key).push(item);
        else
            map.set(key, [item]);
    }
    return Array.from(map.values());
}
exports.groupBy = groupBy;
function toStringSet(list) {
    const map = new Map();
    for (const item of list)
        map.set(item, true);
    return map;
}
//# sourceMappingURL=groupBy.js.map