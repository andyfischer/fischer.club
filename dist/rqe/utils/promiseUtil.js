"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timedOut = void 0;
function timedOut(p, ms) {
    return new Promise(resolve => {
        p.then(() => resolve(false)).catch(() => resolve(false));
        const timer = new Promise(resolve => setTimeout(resolve, ms));
        timer.then(() => resolve(true));
    });
}
exports.timedOut = timedOut;
//# sourceMappingURL=promiseUtil.js.map