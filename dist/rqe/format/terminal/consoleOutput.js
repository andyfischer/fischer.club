"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLogError = exports.terminalFormatError = void 0;
const AnsiColors_1 = require("./AnsiColors");
const Debug_1 = require("../../Debug");
function terminalFormatError(item) {
    let out = `${(0, AnsiColors_1.red)("error")} (${item.errorType})`;
    if (item.message)
        out += `: ${item.message}`;
    for (const [key, value] of Object.entries(item)) {
        if (key === 'errorType' || key === 'stack' || key === 'message')
            continue;
        if (key === 'fromQuery' && value == null)
            continue;
        out += `\n  ${key}: ${(0, Debug_1.toStructuredString)(value)}`;
    }
    if (item.stack)
        out += `\n${(0, AnsiColors_1.grey)(item.stack)}`;
    return out;
}
exports.terminalFormatError = terminalFormatError;
function consoleLogError(item) {
    console.error(terminalFormatError(item));
}
exports.consoleLogError = consoleLogError;
//# sourceMappingURL=consoleOutput.js.map