"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timedOut = void 0;
function timedOut(p, timeoutMs) {
    return new Promise(resolve => {
        const timer = setTimeout((() => {
            resolve(true);
        }), timeoutMs);
        p = p.finally(() => {
            clearTimeout(timer);
            resolve(false);
        });
    });
}
exports.timedOut = timedOut;
//# sourceMappingURL=timedOut.js.map