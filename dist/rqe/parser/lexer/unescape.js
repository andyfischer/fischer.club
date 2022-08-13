"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function unescape(s) {
    const out = [];
    let sliceStart = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '\\') {
            out.push(s.slice(sliceStart, i));
            sliceStart = i + 1;
        }
    }
    out.push(s.slice(sliceStart));
    return out.join('');
}
exports.default = unescape;
//# sourceMappingURL=unescape.js.map