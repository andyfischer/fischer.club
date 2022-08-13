"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ObjectHeader_1 = require("./ObjectHeader");
const Item_1 = require("../Item");
function valueToKeyString(value) {
    if (value == null || value == undefined) {
        return null;
    }
    const itemHeader = (0, ObjectHeader_1.header)(value);
    if (itemHeader) {
        if (!itemHeader.table)
            return value + '';
        return (0, ObjectHeader_1.itemGlobalId)(itemHeader);
    }
    return value + '';
}
class TableIndex {
    constructor(table, attrs) {
        this.data = new Map();
        this.table = table;
        if (!Array.isArray(attrs))
            attrs = [attrs];
        attrs.sort();
        this.attrs = attrs;
        this.attrSet = new Map();
        for (const attr of attrs)
            this.attrSet.set(attr, true);
    }
    toKey(attrs) {
        let key = [];
        for (const attr of this.attrs) {
            const value = attrs.get(attr);
            key.push(valueToKeyString(value));
        }
        return key.join(',');
    }
    toKeyUsingItem(item) {
        let key = [];
        for (const attr of this.attrs) {
            const value = (0, Item_1.get)(item, attr);
            key.push(valueToKeyString(value));
        }
        return key.join(',');
    }
    *get(attrs) {
        const key = this.toKey(attrs);
        const bucket = this.data.get(key);
        if (!bucket)
            return;
        yield* this.data.get(key).values();
    }
    getOne(attrs) {
        for (const item of this.get(attrs))
            return item;
        return null;
    }
    insert(item) {
        const key = this.toKeyUsingItem(item);
        let bucket = this.data.get(key);
        if (!bucket) {
            bucket = new Map();
            this.data.set(key, bucket);
        }
        const itemHeader = (0, ObjectHeader_1.header)(item);
        bucket.set(itemHeader.tableInternalKey, item);
    }
    remove(item) {
        const key = this.toKeyUsingItem(item);
        let bucket = this.data.get(key);
        if (!bucket)
            return;
        bucket.delete((0, ObjectHeader_1.header)(item).tableInternalKey);
        if (bucket.size === 0)
            this.data.delete(key);
    }
    coversItem(item) {
        for (const requiredAttr of this.attrs) {
            if (!(0, Item_1.has)(item, requiredAttr))
                return false;
        }
        return true;
    }
    matchesAttrList(attrs) {
        if (this.attrs.length !== attrs.length)
            return false;
        for (const attr of attrs)
            if (!this.attrSet.has(attr))
                return false;
        return true;
    }
    coversSingleAttribute(attr) {
        return (this.attrs.length === 1 && this.attrs[0] === attr);
    }
    rebuild() {
        this.data = new Map();
        for (const item of this.table.scan())
            this.insert(item);
    }
}
exports.default = TableIndex;
//# sourceMappingURL=TableIndex.js.map