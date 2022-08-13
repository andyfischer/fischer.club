"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUniqueAttr = exports.applyChangeList = exports.applyChangeToMountedTable = exports.applyChange = void 0;
function applyChange(change, table, changeInfo) {
    switch (change.verb) {
        case 'put':
            table.put(change.item, changeInfo);
            break;
        case 'delete':
            table.delete(change.item, changeInfo);
            break;
    }
}
exports.applyChange = applyChange;
function applyChangeToMountedTable(change, table, changeInfo) {
}
exports.applyChangeToMountedTable = applyChangeToMountedTable;
function applyChangeList(changes, table) {
    for (const change of changes) {
        applyChange(change, table);
    }
}
exports.applyChangeList = applyChangeList;
function findUniqueAttr(schema) {
    for (const [attr, attrConfig] of Object.entries(schema.attrs)) {
        if (attrConfig.unique)
            return attr;
    }
    return null;
}
exports.findUniqueAttr = findUniqueAttr;
//# sourceMappingURL=changePropogation.js.map