"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTable = exports.printItems = exports.formatHeader = exports.updateStateForItems = exports.newTableFormatState = exports.formatItems = void 0;
const Item_1 = require("../Item");
const formatItem_1 = require("./formatItem");
const horizLineChar = '\u2501';
const vertLineChar = '\u2503';
const crossLineChar = '\u254b';
function formatItems(state, items) {
    var _a;
    const result = [];
    for (let item of items) {
        if ((_a = state.options) === null || _a === void 0 ? void 0 : _a.transformItemsBeforeFormat)
            item = state.options.transformItemsBeforeFormat(item);
        let rowLineCount = 1;
        const cells = new Map();
        for (const [attr, value] of (0, Item_1.entries)(item)) {
            let cellLineCount = 1;
            const cellStr = (0, formatItem_1.formatValue)(value, state.schema && state.schema[attr]);
            const lines = cellStr.split('\n');
            cells.set(attr, lines);
            if (lines.length > rowLineCount)
                rowLineCount = lines.length;
        }
        result.push({ cells, lineCount: rowLineCount });
    }
    return result;
}
exports.formatItems = formatItems;
function newTableFormatState() {
    return {
        attrs: new Map()
    };
}
exports.newTableFormatState = newTableFormatState;
function updateStateForItems(state, items) {
    for (const item of items) {
        for (let [attr, lines] of item.cells.entries()) {
            attr = attr || '';
            let width = attr.length;
            for (const line of lines)
                if (line.length > width)
                    width = line.length;
            if (!state.attrs.has(attr)) {
                state.attrs.set(attr, {
                    width,
                    highestObservedWidth: width
                });
            }
            else {
                const attrData = state.attrs.get(attr);
                if (width > attrData.highestObservedWidth) {
                    attrData.width = width;
                    attrData.highestObservedWidth = width;
                }
            }
        }
    }
}
exports.updateStateForItems = updateStateForItems;
function rightPadSpaces(s, size) {
    s = s || '';
    if (s.length > size)
        throw new Error(`internal error, string '${s}' is bigger than size ${size}`);
    let spaceRight = size - s.length;
    return s + ' '.repeat(spaceRight);
}
function formatHeader(state) {
    const titleEls = [];
    const titleBarEls = [];
    for (const [attr, details] of state.attrs.entries()) {
        const width = details.width;
        const title = rightPadSpaces(attr, width);
        titleEls.push(title);
        titleBarEls.push(horizLineChar.repeat(width));
    }
    const header = titleEls.join(` ${vertLineChar} `);
    return {
        key: header,
        print(log) {
            if (titleEls.length > 0) {
                log(header);
                log(titleBarEls.join(`${horizLineChar}${crossLineChar}${horizLineChar}`));
            }
        }
    };
}
exports.formatHeader = formatHeader;
function printItems(state, items, log) {
    for (let item of items) {
        for (let lineIndex = 0; lineIndex < item.lineCount; lineIndex++) {
            const outputEls = [];
            for (const [attr, details] of state.attrs.entries()) {
                const lines = item.cells.get(attr) || [];
                const thisLine = lines[lineIndex] || '';
                outputEls.push(rightPadSpaces(thisLine, details.width));
            }
            log(outputEls.join(` ${vertLineChar} `));
        }
    }
}
exports.printItems = printItems;
function formatTable(table) {
    let out = [];
    const formatState = newTableFormatState();
    const formatted = formatItems(formatState, table.scan());
    updateStateForItems(formatState, formatted);
    const header = formatHeader(formatState);
    header.print(s => out.push(s));
    printItems(formatState, formatted, s => out.push(s));
    return out;
}
exports.formatTable = formatTable;
//# sourceMappingURL=TableFormatter.js.map