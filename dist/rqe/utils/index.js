"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroPad = exports.isRunningInNode = exports.timedOut = exports.values = exports.allTrue = exports.freeze = exports.toSet = exports.printError = exports.print = void 0;
function print(...args) {
    console.log(args);
}
exports.print = print;
function printError(err) {
    const message = err.message || '';
    if (message.startsWith('[external] ')) {
        print(message.replace('[external] ', ''));
        return;
    }
    console.log(err.stack || err);
}
exports.printError = printError;
function toSet(items) {
    const set = {};
    for (const item of items) {
        set[item] = true;
    }
    return set;
}
exports.toSet = toSet;
function freeze(value) {
    return JSON.parse(JSON.stringify(value));
}
exports.freeze = freeze;
function allTrue(items) {
    for (const item of items)
        if (!item)
            return false;
    return true;
}
exports.allTrue = allTrue;
function values(obj) {
    const out = [];
    for (const k in obj) {
        out.push(obj[k]);
    }
    return out;
}
exports.values = values;
async function timedOut(p, ms) {
    return new Promise((resolve, reject) => {
        setTimeout((() => resolve(true)), ms);
        p.then(() => resolve(false));
    });
}
exports.timedOut = timedOut;
function isRunningInNode() {
    return (typeof module !== 'undefined' && module.exports);
}
exports.isRunningInNode = isRunningInNode;
function zeroPad(num, len) {
    num = num + '';
    while (num.length < len)
        num = '0' + num;
    return num;
}
exports.zeroPad = zeroPad;
//# sourceMappingURL=index.js.map