"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatItem = exports.formatValueQuoted = exports.formatValue = void 0;
function formatValue(value, schema) {
    if (schema && schema.type === 'TableAttrsList') {
        let out = [];
        for (const [attr, details] of Object.entries(value)) {
            let s = attr;
            if (details.required === false)
                s += '?';
            out.push(s);
        }
        return out.join(' ');
    }
    if (value == null)
        return '';
    if (Buffer.isBuffer(value))
        return value.toString('hex');
    if (typeof value === 'object')
        return JSON.stringify(value);
    return value + '';
}
exports.formatValue = formatValue;
function formatValueQuoted(value, schema) {
    if (value == null)
        return '';
    let str = formatValue(value, schema);
    let needsQuotes = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === ' ') {
            needsQuotes = true;
            break;
        }
    }
    if (needsQuotes)
        str = '"' + str + '"';
    return str;
}
exports.formatValueQuoted = formatValueQuoted;
function formatItemAttr(attr, value) {
    if (value === null || value === undefined)
        return attr;
    switch (value.t) {
        case 'no_value':
            return attr;
        case 'query':
            return `${attr}=(${value.toQueryString()})`;
    }
    return `${attr}=${formatValueQuoted(value)}`;
}
function formatItem(item) {
    const strs = [];
    for (const [attr, value] of Object.entries(item)) {
        strs.push(formatItemAttr(attr, value));
    }
    return strs.join(' ');
}
exports.formatItem = formatItem;
//# sourceMappingURL=formatItem.js.map