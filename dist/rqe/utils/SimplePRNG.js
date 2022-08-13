"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplePRNG = void 0;
class SimplePRNG {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0)
            this.seed += 2147483646;
    }
    next(max) {
        const out = this.seed % max;
        this.seed = this.seed * 16807 % 2147483647;
    }
}
exports.SimplePRNG = SimplePRNG;
//# sourceMappingURL=SimplePRNG.js.map