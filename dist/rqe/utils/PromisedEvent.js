"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromisedEvent = void 0;
class PromisedEvent {
    wait() {
        if (!this._promise) {
            this._promise = new Promise(resolve => {
                this._resolve = resolve;
            });
        }
        return this._promise;
    }
    resolve() {
        this._resolve();
    }
}
exports.PromisedEvent = PromisedEvent;
//# sourceMappingURL=PromisedEvent.js.map