"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCapitalCase = void 0;
function toCapitalCase(s) {
    let capitalizeNext = true;
    let out = '';
    for (let i = 0; i < s.length; i++) {
        let c = s[i];
        if (c === '_' || c === '-' || c === ' ') {
            capitalizeNext = true;
            continue;
        }
        if (capitalizeNext) {
            c = c.toUpperCase();
            capitalizeNext = false;
        }
        out += c;
    }
    return out;
}
exports.toCapitalCase = toCapitalCase;
//# sourceMappingURL=naming.js.map