"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixLooseSchema = exports.parseLooseStringList = exports.findUniqueAttr = void 0;
const parser_1 = require("./parser");
function findUniqueAttr(schema) {
    for (const [attr, attrConfig] of Object.entries(schema.attrs)) {
        if (attrConfig.unique) {
            return [attr, attrConfig];
        }
    }
    return [];
}
exports.findUniqueAttr = findUniqueAttr;
function parseLooseStringList(list) {
    if (Array.isArray(list))
        return list;
    return list.split(' ');
}
exports.parseLooseStringList = parseLooseStringList;
function fixLooseSchema(schema) {
    let attrs;
    let indexes = [];
    if (typeof schema.attrs === 'string') {
        attrs = {};
        const parsed = (0, parser_1.parseQueryTupleWithErrorCheck)(schema.attrs);
        for (const tag of parsed.tags) {
            attrs[tag.attr] = {};
            if (tag.value.t === 'query') {
                for (const nestedTag of tag.value.first().tags) {
                    if (nestedTag.attr === 'generated') {
                        attrs[tag.attr].generate = { method: 'increment' };
                    }
                    else {
                        attrs[tag.attr].type = nestedTag.attr;
                    }
                }
            }
        }
    }
    else {
        attrs = schema.attrs || {};
    }
    for (const looseIndex of schema.indexes || []) {
        if (typeof looseIndex === 'string')
            indexes.push({ attrs: [looseIndex] });
        else
            indexes.push(looseIndex);
    }
    function addIndex(attrs) {
        attrs.sort();
        for (const existing of indexes) {
            if ((existing.attrs + '') === (attrs + ''))
                return;
        }
        indexes.push({ attrs });
    }
    for (const funcDecl of schema.funcs || []) {
        const parsed = (0, parser_1.parseTableDecl)(funcDecl);
        const indexedAttrs = [];
        for (const [attr, attrConfig] of Object.entries(parsed.attrs)) {
            if (attrs[attr] === undefined)
                attrs[attr] = {};
            if (attrConfig.requiresValue)
                indexedAttrs.push(attr);
        }
        addIndex(indexedAttrs);
    }
    for (const [attr, attrConfig] of Object.entries(attrs)) {
        const fixedConfig = {
            ...attrConfig
        };
        if (fixedConfig.unique === false)
            delete fixedConfig.unique;
        if (fixedConfig.unique === true)
            fixedConfig.unique = { onConflict: 'error' };
        if (fixedConfig.generate) {
            if (fixedConfig.generate === true)
                fixedConfig.generate = { method: 'increment' };
            if (!fixedConfig.unique)
                fixedConfig.unique = { onConflict: 'error' };
            fixedConfig.index = true;
        }
        if (fixedConfig.unique) {
            fixedConfig.index = true;
        }
        attrs[attr] = fixedConfig;
    }
    return {
        ...schema,
        attrs,
        indexes,
    };
}
exports.fixLooseSchema = fixLooseSchema;
//# sourceMappingURL=Schema.js.map