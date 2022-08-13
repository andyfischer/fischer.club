"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyPool = void 0;
class ConcurrencyPool {
    constructor(activeLimit) {
        this.nextId = 1;
        this.active = new Set();
        this.activeLimit = 400;
        this.activeLimit = activeLimit;
    }
    async run(callback) {
        while (this.active.size >= this.activeLimit) {
            await this.waitForNextFinish();
        }
        const id = this.nextId;
        this.nextId++;
        this.active.add(id);
        const promise = callback();
        return promise
            .finally(() => {
            this.active.delete(id);
            if (this.waitingForNext) {
                const resolve = this.resolveNext;
                this.waitingForNext = null;
                this.resolveNext = null;
                resolve();
            }
        });
    }
    async finish() {
        while (this.active.size > 0) {
            await this.waitForNextFinish();
        }
    }
    async waitForNextFinish() {
        if (!this.waitingForNext) {
            this.waitingForNext = new Promise(r => { this.resolveNext = r; });
        }
        await this.waitingForNext;
    }
}
exports.ConcurrencyPool = ConcurrencyPool;
//# sourceMappingURL=ConcurrencyPool.js.map