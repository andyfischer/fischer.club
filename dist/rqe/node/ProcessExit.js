"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulExit = exports.overrideProcessExit = exports.getExitCallbacksTable = void 0;
const Table_1 = require("../Table");
const promiseUtil_1 = require("../utils/promiseUtil");
let _startedGracefulExit = false;
let _didOverrideProcessExit = false;
let _actualProcessExit = null;
let _exitCallbacksTable;
function getExitCallbacksTable() {
    if (!_exitCallbacksTable) {
        _exitCallbacksTable = new Table_1.Table({
            attrs: {
                callback: {}
            }
        });
    }
    return _exitCallbacksTable;
}
exports.getExitCallbacksTable = getExitCallbacksTable;
function overrideProcessExit() {
    if (_didOverrideProcessExit)
        return;
    _didOverrideProcessExit = true;
    _actualProcessExit = process.exit;
    process.exit = gracefulExit;
}
exports.overrideProcessExit = overrideProcessExit;
async function gracefulExit(exitCode = 0) {
    if (_startedGracefulExit)
        return;
    _startedGracefulExit = true;
    process.exitCode = exitCode;
    let promises = [];
    for (const { callback } of getExitCallbacksTable().scan()) {
        try {
            const result = callback();
            promises.push(result);
        }
        catch (err) {
            console.error(err);
        }
    }
    const timeoutMs = 500;
    const allSettled = Promise.allSettled(promises);
    if (await (0, promiseUtil_1.timedOut)(allSettled, timeoutMs)) {
        console.error(`timed out (${timeoutMs}ms) waiting for all on_exit callbacks`);
    }
    if (_actualProcessExit)
        _actualProcessExit();
    else
        process.exit();
}
exports.gracefulExit = gracefulExit;
process.on('SIGINT', () => gracefulExit(0));
//# sourceMappingURL=ProcessExit.js.map