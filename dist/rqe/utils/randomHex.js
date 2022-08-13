"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomHex = void 0;
const hexLetters = '0123456789abcdef';
function randomHex(length) {
    let out = '';
    while (length > 0) {
        const letter = hexLetters[Math.floor(Math.random() * hexLetters.length)];
        out += letter;
        length--;
    }
    return out;
}
exports.randomHex = randomHex;
//# sourceMappingURL=randomHex.js.map