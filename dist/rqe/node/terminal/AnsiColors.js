"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yellow = exports.green = exports.red = exports.black = exports.colorize = void 0;
const resetForeground = 39;
const resetBackground = 49;
function colorize(color, str) {
    return `\u001b[38;2;${color.r};${color.g};${color.b};m${str}\u001b[${resetForeground}m`;
}
exports.colorize = colorize;
function toColorizeFunction(color) {
    return (str) => colorize(color, str);
}
exports.black = toColorizeFunction({ r: 0, g: 0, b: 0 });
exports.red = toColorizeFunction({ r: 255, g: 0, b: 0 });
exports.green = toColorizeFunction({ r: 0, g: 255, b: 0 });
exports.yellow = toColorizeFunction({ r: 255, g: 255, b: 0 });
//# sourceMappingURL=AnsiColors.js.map