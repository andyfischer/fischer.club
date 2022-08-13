"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateStamp = void 0;
const __1 = require("..");
function getDateStamp() {
    const now = new Date();
    return `${(0, __1.zeroPad)(now.getUTCFullYear(), 4)}`
        + `-${(0, __1.zeroPad)(now.getUTCMonth() + 1, 2)}`
        + `-${(0, __1.zeroPad)(now.getUTCDate(), 2)}`;
}
exports.getDateStamp = getDateStamp;
//# sourceMappingURL=index.js.map