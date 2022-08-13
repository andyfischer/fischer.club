"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isItem = exports.newItem = exports.shallowCopy = exports.entries = exports.attrs = exports.set = exports.get = exports.has = void 0;
function has(item, attr) {
    if (item.t)
        throw new Error(`don't call has() on item of type: ` + item.t);
    return item[attr] !== undefined;
}
exports.has = has;
function get(item, attr) {
    return item[attr];
}
exports.get = get;
function set(item, attr, value) {
    item[attr] = value;
}
exports.set = set;
function attrs(item) {
    return Object.keys(item);
}
exports.attrs = attrs;
function entries(item) {
    return Object.entries(item);
}
exports.entries = entries;
function shallowCopy(item) {
    return { ...item };
}
exports.shallowCopy = shallowCopy;
function newItem() {
    return {};
}
exports.newItem = newItem;
function isItem(value) {
    return !!value && typeof value === 'object';
}
exports.isItem = isItem;
//# sourceMappingURL=Item.js.map