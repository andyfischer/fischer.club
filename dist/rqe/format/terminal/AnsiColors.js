"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsi = exports.ansiRegex = exports.yellowBg = exports.redBg = exports.greenBg = exports.grey = exports.yellow = exports.green = exports.red = exports.black = exports.colorizeBg = exports.colorize = void 0;
const setForeground = 38;
const resetForeground = 39;
const setBackground = 48;
const resetBackground = 49;
function colorizeFunction(color) {
    return (str) => colorize(color, str);
}
function colorizeBgFunction(color) {
    return (str) => colorizeBg(color, str);
}
function colorize(color, str) {
    return `\u001b[${setForeground};2;${color.r};${color.g};${color.b};m${str}\u001b[${resetForeground}m`;
}
exports.colorize = colorize;
function colorizeBg(color, str) {
    return `\u001b[${setBackground};2;${color.r};${color.g};${color.b};m${str}\u001b[${resetBackground}m`;
}
exports.colorizeBg = colorizeBg;
exports.black = colorizeFunction({ r: 0, g: 0, b: 0 });
exports.red = colorizeFunction({ r: 255, g: 0, b: 0 });
exports.green = colorizeFunction({ r: 0, g: 255, b: 0 });
exports.yellow = colorizeFunction({ r: 255, g: 255, b: 0 });
exports.grey = colorizeFunction({ r: 120, g: 120, b: 120 });
exports.greenBg = colorizeBgFunction({ r: 50, g: 220, b: 0 });
exports.redBg = colorizeBgFunction({ r: 255, g: 0, b: 0 });
exports.yellowBg = colorizeBgFunction({ r: 255, g: 255, b: 0 });
let _ansiRegex;
function ansiRegex({ onlyFirst = false } = {}) {
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
    ].join('|');
    return new RegExp(pattern, onlyFirst ? undefined : 'g');
}
exports.ansiRegex = ansiRegex;
function stripAnsi(s) {
    _ansiRegex = _ansiRegex || ansiRegex();
    return s.replace(_ansiRegex, '');
}
exports.stripAnsi = stripAnsi;
//# sourceMappingURL=AnsiColors.js.map