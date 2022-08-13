"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AutoInitMap {
    constructor(init) {
        this.map = new Map();
        this.init = init;
    }
    get(k) {
        if (!this.map.has(k)) {
            let val = this.init(k);
            this.map.set(k, val);
            return val;
        }
        else {
            return this.map.get(k);
        }
    }
    getExisting(k) {
        return this.map.get(k);
    }
    set(k, v) {
        return this.map.set(k, v);
    }
    has(k) {
        return this.map.has(k);
    }
    values() {
        return this.map.values();
    }
    entries() {
        return this.map.entries();
    }
}
exports.default = AutoInitMap;
//# sourceMappingURL=AutoInitMap.js.map