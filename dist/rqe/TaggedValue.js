"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSerializable = exports.tvalEquals = exports.taggedFromObject = exports.taggedToObject = exports.taggedToString = exports.wrapItem = exports.unwrapTagged = exports.toTagged = void 0;
const Query_1 = require("./Query");
const QueryTuple_1 = require("./QueryTuple");
const formatItem_1 = require("./format/formatItem");
const MountPoint_1 = require("./MountPoint");
const config_1 = require("./config");
const Debug_1 = require("./Debug");
function toTagged(val) {
    if (val == null) {
        return {
            t: 'no_value',
        };
    }
    switch (val.t) {
        case 'query':
        case 'queryTuple':
            return val;
    }
    switch (typeof val) {
        case 'string':
            return {
                t: 'str_value',
                str: val,
            };
        case 'number':
            return {
                t: 'str_value',
                str: val + '',
            };
    }
    return {
        t: 'obj_value',
        val,
    };
    throw new Error("unsupported type in toTagged: " + val);
}
exports.toTagged = toTagged;
function unwrapTagged(tval) {
    switch (tval.t) {
        case 'str_value':
            return tval.str;
        case 'no_value':
            return null;
        case 'query':
        case 'queryTuple':
            return tval;
        case 'item':
            return tval.item;
        case 'obj_value':
            return tval.val;
        case 'abstract':
            throw new Error(`can't unwrap an abstract value`);
        default:
            throw new Error('unhandled case in unwrapTagged: ' + tval.t);
    }
}
exports.unwrapTagged = unwrapTagged;
function wrapItem(item) {
    return { t: 'item', item };
}
exports.wrapItem = wrapItem;
function taggedToString(tval) {
    switch (tval.t) {
        case 'str_value':
            return tval.str;
        case 'no_value':
            return '<no_value>';
        case 'query':
            return '(' + tval.toQueryString() + ')';
        case 'queryTuple': {
            return (0, QueryTuple_1.queryTupleToString)(tval);
        }
        case 'item':
            return (0, formatItem_1.formatItem)(tval.item);
        case 'obj_value':
            return JSON.stringify(tval.val);
        case 'mountPointSpec':
            return (0, MountPoint_1.pointSpecToDeclString)(tval);
        case 'abstract':
            return '<abstract>';
        default:
            if (config_1.TaggedValueErrorOnUnknownTag)
                throw new Error('unknown type in taggedToString: ' + tval.t);
            return JSON.stringify(tval);
    }
}
exports.taggedToString = taggedToString;
function taggedToObject(tval) {
    switch (tval.t) {
        case 'query':
            return tval.toObject();
        case 'queryTuple':
            return tval.toObject();
    }
    return tval;
}
exports.taggedToObject = taggedToObject;
function taggedFromObject(object) {
    switch (object.t) {
        case 'queryObject':
            return Query_1.Query.fromObject(object);
        case 'queryTupleObject':
            return QueryTuple_1.QueryTuple.fromObject(object);
        case 'query':
            throw new Error("can't fromObject a value with t=query");
        case 'queryTuple':
            throw new Error("can't fromObject a value with t=queryTuple");
    }
    return object;
}
exports.taggedFromObject = taggedFromObject;
function tvalEquals(left, right) {
    if (left.t !== right.t)
        return false;
    switch (left.t) {
        case 'item':
        case 'queryTuple':
        case 'obj_value':
            console.warn('warning- tvalEquals not fully implemented for objects');
    }
    return unwrapTagged(left) === unwrapTagged(right);
}
exports.tvalEquals = tvalEquals;
function toSerializable(val) {
    if (val === null || val === void 0 ? void 0 : val.t) {
        switch (val.t) {
            case 'query':
            case 'queryTuple':
                return val.toObject();
        }
    }
    (0, Debug_1.assertDataIsSerializable)(val);
    return val;
}
exports.toSerializable = toSerializable;
//# sourceMappingURL=TaggedValue.js.map