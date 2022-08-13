"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
function round(n, sigfigs) {
    return Math.round(n * (10 ** sigfigs)) / (10 ** sigfigs);
}
class Timer {
    constructor() {
        this.start = Date.now();
    }
    toString() {
        const elapsedMs = Date.now() - this.start;
        if (elapsedMs > 500) {
            return `${round(elapsedMs / 1000, 1)}s`;
        }
        return `${elapsedMs}ms`;
    }
}
exports.Timer = Timer;
//# sourceMappingURL=Timer.js.map