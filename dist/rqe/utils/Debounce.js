"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Debounce {
    constructor(callback, delayMs = 0) {
        this.callback = null;
        this.pending = null;
        this.delayMs = delayMs;
        this.callback = callback;
    }
    post(...args) {
        this.pendingArgs = args;
        if (!this.pending) {
            this.pending = setTimeout(() => this.fire(), this.delayMs);
        }
    }
    fire() {
        delete this.pending;
        const args = this.pendingArgs;
        delete this.pendingArgs;
        this.callback.apply(null, args);
    }
    cancel() {
        clearTimeout(this.pending);
        delete this.pending;
    }
}
exports.default = Debounce;
//# sourceMappingURL=Debounce.js.map