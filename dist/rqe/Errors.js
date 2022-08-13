"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureExceptionAsErrorItem = exports.newErrorFromItems = exports.newError = exports.ErrorExtended = exports.newErrorTable = exports.errorItemToString = exports.errorItemToOneLineString = exports.ErrorTableSchema = exports.TableImplementationError = exports.TableSchemaIssue = void 0;
const index_1 = require("./Table/index");
const Debug_1 = require("./Debug");
class TableSchemaIssue extends Error {
    constructor(table, message) {
        super(`Table [${table.name}] schema issue: ${message}`);
    }
}
exports.TableSchemaIssue = TableSchemaIssue;
class TableImplementationError extends Error {
    constructor(message, meta) {
        super(`Module error: ${message}`);
    }
}
exports.TableImplementationError = TableImplementationError;
exports.ErrorTableSchema = {
    attrs: {
        errorType: {},
        message: {},
        stack: {},
        step: {},
        phase: {},
    }
};
function errorItemToOneLineString(item) {
    let out = `error (${item.errorType})`;
    if (item.message)
        out += `: ${item.message}`;
    if (item.fromQuery)
        out += `: ${(0, Debug_1.toStructuredString)(item.fromQuery)}`;
    return out;
}
exports.errorItemToOneLineString = errorItemToOneLineString;
function errorItemToString(item) {
    let out = `error (${item.errorType})`;
    if (item.message)
        out += `: ${item.message}`;
    for (const dataItem of item.data || []) {
        if (dataItem.query)
            out += `\n (${dataItem.query.toQueryString()})`;
        else
            out += `\n (${(0, Debug_1.toStructuredString)(dataItem)})`;
    }
    if (item.fromQuery)
        out += `\n from query: (${(0, Debug_1.toStructuredString)(item.fromQuery)})`;
    const otherDetails = { ...item };
    delete otherDetails.errorType;
    delete otherDetails.fromQuery;
    delete otherDetails.data;
    delete otherDetails.message;
    delete otherDetails.step;
    const otherDetailsString = JSON.stringify(otherDetails);
    if (otherDetailsString !== '{}')
        out += `\n ${otherDetailsString}`;
    if (item.stack)
        out += `\nStack trace: ${item.stack}`;
    return out;
}
exports.errorItemToString = errorItemToString;
function newErrorTable() {
    return new index_1.Table(exports.ErrorTableSchema);
}
exports.newErrorTable = newErrorTable;
class ErrorExtended extends Error {
    constructor(errorItem) {
        super(errorItemToString(errorItem));
        this.errorItem = errorItem;
    }
    toString() {
        return errorItemToString(this.errorItem);
    }
}
exports.ErrorExtended = ErrorExtended;
function newError(item) {
    return new ErrorExtended(item);
}
exports.newError = newError;
function newErrorFromItems(items) {
    if (items.length === 0)
        throw new Error('newErrorFromItems called with empty list');
    const first = items[0];
    if (items.length > 1) {
        first.data = first.data || [];
        first.data.push({ moreErrors: items.slice(1) });
    }
    return newError(first);
}
exports.newErrorFromItems = newErrorFromItems;
function captureExceptionAsErrorItem(error, context = {}) {
    if (error.errorItem) {
        const errorItem = error.errorItem;
        return {
            fromQuery: context.fromQuery || null,
            message: error.message || errorItem.message,
            stack: error.stack || errorItem.stack,
            ...error.errorItem,
        };
    }
    if (error instanceof Error) {
        return {
            errorType: error.errorType || 'unhandled_exception',
            message: error.message,
            stack: error.stack,
            fromQuery: context.fromQuery || error.fromQuery || null,
        };
    }
    return {
        errorType: error.errorType || 'unknown_error',
        message: error.message,
        stack: error.stack,
        fromQuery: context.fromQuery || error.fromQuery || null,
    };
}
exports.captureExceptionAsErrorItem = captureExceptionAsErrorItem;
//# sourceMappingURL=Errors.js.map