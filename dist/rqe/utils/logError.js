"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalError = void 0;
function internalError(s) {
    console.error('[internal error] ' + s);
}
exports.internalError = internalError;
function logError(event) {
    const error = event.stack || event;
    console.error(error);
}
exports.default = logError;
//# sourceMappingURL=logError.js.map