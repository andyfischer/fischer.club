"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordUnhandledException = exports.recordUnhandledError = exports.recordFailure = exports.shouldCheck = void 0;
const globalGraph_1 = require("./globalGraph");
const formatItem_1 = require("./format/formatItem");
const IDSource_1 = require("./utils/IDSource");
const Errors_1 = require("./Errors");
let _samplingCheckCount = 0;
let _samplingCheckTimer = null;
let _nextFailureId = new IDSource_1.IDSource('fail-');
const RESET_INTERVAL_MS = 1000;
const SAMPLE_50_PCT_AT_COUNT = 100;
const SAMPLE_10_PCT_AT_COUNT = 1000;
const SAMPLE_0_AT_COUNT = 5000;
function shouldCheck() {
    _samplingCheckCount++;
    if (!_samplingCheckTimer) {
        _samplingCheckTimer = setTimeout((() => {
            _samplingCheckCount = 0;
            _samplingCheckTimer = null;
        }), RESET_INTERVAL_MS);
    }
    if (_samplingCheckCount > SAMPLE_0_AT_COUNT)
        return false;
    if (_samplingCheckCount > SAMPLE_10_PCT_AT_COUNT)
        return Math.random() > .9;
    if (_samplingCheckCount > SAMPLE_50_PCT_AT_COUNT)
        return Math.random() > .5;
    return true;
}
exports.shouldCheck = shouldCheck;
function recordFailure(message, attrs = {}) {
    const failure_id = _nextFailureId.take();
    const graph = attrs.graph || (0, globalGraph_1.getGraph)();
    const table = graph.builtins.failures();
    let stack = (new Error()).stack;
    stack = stack.split('\n').slice(2).join('\n');
    const remainingAttrs = {
        ...attrs,
    };
    delete remainingAttrs.graph;
    table.put({
        message,
        failure_id,
        check_attrs: remainingAttrs,
        stack,
    });
    let formattedStackTrace = '' + stack;
    formattedStackTrace = formattedStackTrace.split('\n').slice(1).join('\n');
    if (!graph.silentFailures)
        console.error(`failure: ${message} ${(0, formatItem_1.formatItem)(remainingAttrs)}\n${formattedStackTrace}`);
    return failure_id;
}
exports.recordFailure = recordFailure;
function recordUnhandledError(error, graph) {
    const failure_id = _nextFailureId.take();
    graph = graph || (0, globalGraph_1.getGraph)();
    const table = graph.builtins.failures();
    let stack = error.stack || (new Error()).stack;
    table.put({
        message: error.message,
        failure_id,
        check_attrs: error,
        stack,
    });
    let formattedStackTrace = '' + stack;
    formattedStackTrace = formattedStackTrace.split('\n').slice(1).join('\n');
    if (!graph.silentFailures)
        console.error(`failure: ${error.message}\n${formattedStackTrace}`);
    return failure_id;
}
exports.recordUnhandledError = recordUnhandledError;
function recordUnhandledException(e, graph) {
    const item = (0, Errors_1.captureExceptionAsErrorItem)(e);
    recordUnhandledError(item, graph);
}
exports.recordUnhandledException = recordUnhandledException;
//# sourceMappingURL=FailureTracking.js.map