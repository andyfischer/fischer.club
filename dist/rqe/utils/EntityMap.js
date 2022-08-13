"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntitySet {
    constructor({ idPrefix } = {}) {
        this.nextId = 1;
        this.map = new Map();
        this.idPrefix = idPrefix || '';
    }
    get(id) {
        return this.map.get(id);
    }
    has(id) {
        return this.map.has(id);
    }
    add(item) {
        const id = this.idPrefix + this.nextId;
        this.nextId++;
        this.map.set(id, item);
        return id;
    }
    delete(id) {
        this.map.delete(id);
    }
    entries() {
        return this.map.entries();
    }
    items() {
        return this.map.values();
    }
}
exports.default = EntitySet;
//# sourceMappingURL=EntityMap.js.map