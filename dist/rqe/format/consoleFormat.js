"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleFormatError = exports.consoleFormatRelation = void 0;
const consolePrintTable_1 = __importDefault(require("./consolePrintTable"));
const Item_1 = require("../Item");
const formatItem_1 = require("./formatItem");
function isMultiColumn(rel) {
    const columns = new Map();
    for (const item of rel.scan()) {
        for (const attr of (0, Item_1.attrs)(item)) {
            columns.set(attr, true);
            if (columns.size > 1)
                return true;
        }
    }
    return false;
}
function consoleFormatRelation(rel) {
    if (rel.hasError()) {
        return consoleFormatError(rel);
    }
    const out = [];
    if (rel.hasError())
        for (const error of rel.errors().list())
            out.push(`#error ${error.errorType} ${error.message || ''}`);
    if (isMultiColumn(rel)) {
        for (const line of (0, consolePrintTable_1.default)(rel)) {
            out.push('  ' + line);
        }
    }
    else {
        for (const item of rel.scan()) {
            out.push('  ' + (0, formatItem_1.formatItem)(item));
        }
    }
    return out;
}
exports.consoleFormatRelation = consoleFormatRelation;
function consoleFormatError(rel) {
    return rel.errors().list().map(error => `Error: ${error.message}`);
}
exports.consoleFormatError = consoleFormatError;
//# sourceMappingURL=consoleFormat.js.map