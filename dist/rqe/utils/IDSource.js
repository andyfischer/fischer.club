"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDSource = exports.IDSourceNumber = void 0;
class IDSourceNumber {
    constructor() {
        this.next = 1;
    }
    copyFrom(source) {
        this.next = source.next;
    }
    take() {
        const out = this.next;
        this.next++;
        return out;
    }
}
exports.IDSourceNumber = IDSourceNumber;
class IDSource {
    constructor(prefix = '') {
        this.next = 1;
        this.prefix = prefix;
    }
    take() {
        const result = this.prefix + this.next + '';
        this.next += 1;
        return result;
    }
}
exports.IDSource = IDSource;
//# sourceMappingURL=IDSource.js.map