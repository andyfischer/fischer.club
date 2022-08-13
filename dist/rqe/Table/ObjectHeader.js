"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemGlobalId = exports.header = exports.clearHeader = exports.withoutHeader = exports.initRowInfo = void 0;
function initRowInfo(object, rowinfo) {
    Object.defineProperty(object, 'rowinfo', { value: 'static', writable: true });
    object.rowinfo = rowinfo;
}
exports.initRowInfo = initRowInfo;
function withoutHeader(object) {
    return {
        ...object,
    };
}
exports.withoutHeader = withoutHeader;
function clearHeader(object) {
    object.rowinfo = {};
}
exports.clearHeader = clearHeader;
function header(object) {
    return object.rowinfo;
}
exports.header = header;
function itemGlobalId(header) {
    if (header.globalId)
        return header.globalId;
    const globalId = header.table.name + '/' + header.tableInternalKey;
    header.globalId = globalId;
    return globalId;
}
exports.itemGlobalId = itemGlobalId;
//# sourceMappingURL=ObjectHeader.js.map