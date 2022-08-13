"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeArray = void 0;
function maybeArray(item) {
    if (Array.isArray(item))
        return item;
    return [item];
}
exports.maybeArray = maybeArray;
//# sourceMappingURL=arrayUtil.js.map