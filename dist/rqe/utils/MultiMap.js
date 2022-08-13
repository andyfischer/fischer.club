"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiMap = void 0;
class MultiMap {
    constructor() {
        this.items = new Map();
    }
    add(key, item) {
        if (!this.items.has(key))
            this.items.set(key, []);
        this.items.get(key).push(item);
    }
    has(key) {
        return this.items.has(key);
    }
    get(key) {
        return this.items.get(key) || [];
    }
    keys() {
        return this.items.keys();
    }
    entries() {
        return this.items.entries();
    }
    size() {
        return this.items.size;
    }
}
exports.MultiMap = MultiMap;
//# sourceMappingURL=MultiMap.js.map