"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printItemsAsTable = void 0;
const Item_1 = require("../Item");
const formatItem_1 = require("./formatItem");
class LazyMap {
    constructor(loader) {
        this.m = new Map();
        this.loader = loader;
    }
    get(key) {
        if (!this.m.has(key)) {
            const val = this.loader(key);
            this.m.set(key, val);
            return val;
        }
        return this.m.get(key);
    }
    values() {
        return this.m.values();
    }
}
class Column {
    constructor(title) {
        this.items = [];
        this.width = 0;
        this.outputStrings = [];
        this.title = title;
    }
    formatCell(v) {
        const s = (0, formatItem_1.formatValue)(v);
        return rightPadSpaces(s, this.width);
    }
}
function rightPadSpaces(s, size) {
    if (s.length > size)
        throw new Error(`internal error, string '${s}' is bigger than size ${size}`);
    let spaceRight = size - s.length;
    return s + ' '.repeat(spaceRight);
}
function centerPadSpaces(s, size) {
    if (s.length > size)
        throw new Error(`internal error, string '${s}' is bigger than size ${size}`);
    let spaceLeft = Math.floor((size - s.length) / 2);
    let spaceRight = Math.ceil((size - s.length) / 2);
    return ' '.repeat(spaceLeft) + s + ' '.repeat(spaceRight);
}
const horizLineChar = '\u2501';
const vertLineChar = '\u2503';
const crossLineChar = '\u254b';
function printAsTable(rel) {
    const columns = new LazyMap(title => new Column(title));
    const outputLines = [];
    for (const item of rel.scan()) {
        for (const attr of (0, Item_1.attrs)(item)) {
            const column = columns.get(attr);
            const value = (0, Item_1.get)(item, attr);
            const str = (0, formatItem_1.formatValue)(value);
            column.items.push(str);
        }
    }
    for (const column of columns.values()) {
        column.width = Math.max(column.width, column.title.length);
        for (const item of column.items) {
            let length = (item && item.length) || 0;
            if (!isFinite(length))
                length = 0;
            column.width = Math.max(column.width, length);
        }
    }
    const titleEls = [];
    const titleBarEls = [];
    for (const column of columns.values()) {
        titleEls.push(column.formatCell(column.title));
        titleBarEls.push(horizLineChar.repeat(column.width));
    }
    outputLines.push(titleEls.join(` ${vertLineChar} `));
    outputLines.push(titleBarEls.join(`${horizLineChar}${crossLineChar}${horizLineChar}`));
    for (const item of rel.scan()) {
        const outputEls = [];
        for (const column of columns.values()) {
            const value = (0, Item_1.has)(item, column.title) ? ((0, Item_1.get)(item, column.title)) : '';
            outputEls.push(column.formatCell(value));
        }
        outputLines.push(outputEls.join(` ${vertLineChar} `));
    }
    return outputLines;
}
exports.default = printAsTable;
function printItemsAsTable(items) {
    const columns = new LazyMap(title => new Column(title));
    const outputLines = [];
    for (const item of items) {
        for (const attr of (0, Item_1.attrs)(item)) {
            const column = columns.get(attr);
            const value = (0, Item_1.get)(item, attr);
            const str = (0, formatItem_1.formatValue)(value);
            column.items.push(str);
        }
    }
    for (const column of columns.values()) {
        column.width = Math.max(column.width, column.title.length);
        for (const item of column.items) {
            let length = (item && item.length) || 0;
            if (!isFinite(length))
                length = 0;
            column.width = Math.max(column.width, length);
        }
    }
    const titleEls = [];
    const titleBarEls = [];
    for (const column of columns.values()) {
        titleEls.push(column.formatCell(column.title));
        titleBarEls.push(horizLineChar.repeat(column.width));
    }
    outputLines.push(titleEls.join(` ${vertLineChar} `));
    outputLines.push(titleBarEls.join(`${horizLineChar}${crossLineChar}${horizLineChar}`));
    for (const item of items) {
        const outputEls = [];
        for (const column of columns.values()) {
            const value = (0, Item_1.has)(item, column.title) ? ((0, Item_1.get)(item, column.title)) : '';
            outputEls.push(column.formatCell(value));
        }
        outputLines.push(outputEls.join(` ${vertLineChar} `));
    }
    return outputLines;
}
exports.printItemsAsTable = printItemsAsTable;
//# sourceMappingURL=consolePrintTable.js.map