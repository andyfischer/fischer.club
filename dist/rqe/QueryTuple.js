"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toQueryTuple = exports.queryTagToString = exports.queryTupleToString = exports.QueryTuple = void 0;
const TaggedValue_1 = require("./TaggedValue");
const QuickMount_1 = require("./QuickMount");
const parseQueryTuple_1 = require("./parser/parseQueryTuple");
const TaggedValue_2 = require("./TaggedValue");
const Item_1 = require("./Item");
const arrayUtil_1 = require("./utils/arrayUtil");
function tagsEqual(lhs, rhs) {
    return ((lhs.t === rhs.t)
        && (lhs.attr === rhs.attr)
        && ((0, TaggedValue_2.tvalEquals)(lhs.value, rhs.value))
        && (lhs.identifier === rhs.identifier)
        && (lhs.isOptional === rhs.isOptional));
}
class QueryTuple {
    constructor(tags) {
        this.t = 'queryTuple';
        this.tags = tags;
        this.rebuildByAttr();
    }
    rebuildByAttr() {
        this.byAttr = new Map();
        for (let i = 0; i < this.tags.length; i++) {
            const tag = this.tags[i];
            if (this.byAttr.has(tag.attr))
                throw new Error("duplicate attr: " + tag.attr);
            this.byAttr.set(tag.attr, i);
        }
    }
    getAttr(attr) {
        const found = this.byAttr.get(attr);
        if (found === undefined)
            return null;
        return this.tags[found];
    }
    getStringValue(attr) {
        const tag = this.getAttr(attr);
        if (tag.value.t === 'str_value')
            return tag.value.str;
        throw new Error("not a string: " + attr);
    }
    has(attr) {
        return this.byAttr.has(attr);
    }
    hasValue(attr) {
        const tag = this.getAttr(attr);
        return tag && tag.value.t !== 'no_value';
    }
    hasStar() {
        for (const tag of this.tags)
            if (tag.specialAttr && tag.specialAttr.t === 'star')
                return true;
        return false;
    }
    shallowCopy() {
        return new QueryTuple(this.tags.concat());
    }
    withoutStar() {
        return new QueryTuple(this.tags.filter(tag => tag.specialAttr && tag.specialAttr.t === 'star'));
    }
    withoutFirstTag() {
        return new QueryTuple(this.tags.slice(1));
    }
    addTag(tag) {
        if (this.byAttr.has(tag.attr))
            throw new Error("duplicate attr: " + tag.attr);
        this.byAttr.set(tag.attr, this.tags.length);
        this.tags.push(tag);
    }
    addAttr(attr) {
        if (this.byAttr.has(attr))
            throw new Error("duplicate attr: " + attr);
        this.tags.push({ t: 'tag', attr, value: { t: 'no_value' } });
    }
    addAttrIfNeeded(attr) {
        if (this.byAttr.has(attr))
            return;
        this.addAttr(attr);
    }
    addAttrs(attrs) {
        for (const attr of attrs)
            this.addAttr(attr);
    }
    addAttrsIfNeeded(attrs) {
        for (const attr of attrs)
            this.addAttrIfNeeded(attr);
    }
    remapTags(callback) {
        const newTags = [];
        for (const tag of this.tags) {
            const newTag = callback(tag);
            if (newTag)
                newTags.push(newTag);
        }
        return new QueryTuple(newTags);
    }
    overwriteTag(tag) {
        if (!this.byAttr.has(tag.attr))
            throw new Error("can't overwrite, tag not present: " + tag.attr);
        this.tags[this.byAttr.get(tag.attr)] = tag;
    }
    addOrOverwriteTag(tag) {
        if (this.byAttr.has(tag.attr))
            this.overwriteTag(tag);
        else
            this.addTag(tag);
    }
    deleteAttr(attr) {
        const found = this.byAttr.get(attr);
        if (found === undefined)
            return;
        this.tags = this.tags.slice(0, found).concat(this.tags.slice(found + 1));
        this.rebuildByAttr();
    }
    toItemValue() {
        const item = {};
        for (const tag of this.tags) {
            item[tag.attr] = (0, TaggedValue_1.unwrapTagged)(tag.value);
        }
        return item;
    }
    toDefaultIncludeValues() {
        const item = {};
        for (const tag of this.tags) {
            if (tag.value.t === 'abstract')
                continue;
            item[tag.attr] = (0, TaggedValue_1.unwrapTagged)(tag.value);
        }
        return item;
    }
    injectParameters(parameters) {
        return this.remapTags(tag => {
            if (tag.value.t === 'queryTuple') {
                return {
                    ...tag,
                    value: tag.value.injectParameters(parameters),
                };
            }
            if (tag.value.t === 'query') {
                const nestedQuery = tag.value;
                return {
                    ...tag,
                    value: tag.value.injectParameters(parameters),
                };
            }
            if (tag.identifier && parameters[tag.identifier] !== undefined) {
                return {
                    ...tag,
                    identifier: null,
                    value: (0, TaggedValue_1.toTagged)(parameters[tag.identifier]),
                };
            }
            return tag;
        });
    }
    getRelated(modifier) {
        const out = this.shallowCopy();
        if (modifier.with)
            for (const attr of (0, arrayUtil_1.maybeArray)(modifier.with))
                out.addOrOverwriteTag({ t: 'tag', attr, value: { t: 'no_value' } });
        if (modifier.without)
            for (const attr of (0, arrayUtil_1.maybeArray)(modifier.without))
                out.deleteAttr(attr);
        return out;
    }
    getErrorOnUnfilledParameters() {
        for (const tag of this.tags) {
            if (tag.identifier)
                return { errorType: 'missing_parameter', data: [{ missingParameterFor: tag.identifier }] };
        }
    }
    errorOnUnfilledParameters() {
        for (const tag of this.tags) {
            if (tag.identifier)
                throw new Error(`Missing parameter for $${tag.identifier}`);
        }
    }
    checkFilledParameters(params) {
        for (const tag of this.tags) {
            if (tag.identifier && !(0, Item_1.has)(params, tag.attr))
                throw new Error(`Missing parameter for $${tag.identifier}`);
        }
    }
    convertToPut() {
        const query = this.shallowCopy();
        query.addTag({ t: 'tag', attr: 'put!', value: { t: 'no_value' } });
        return query;
    }
    static fromItem(item) {
        const tags = [];
        for (const [attr, value] of Object.entries(item)) {
            tags.push({
                t: 'tag',
                attr,
                value: (value == null) ? { t: 'no_value' } : (0, TaggedValue_1.toTagged)(value)
            });
        }
        return new QueryTuple(tags);
    }
    toObject() {
        return {
            t: 'queryTupleObject',
            tags: this.tags.map(tag => ({
                ...tag,
                value: (0, TaggedValue_2.taggedToObject)(tag.value),
            }))
        };
    }
    equals(rhs) {
        if ((this.t !== rhs.t)
            || (this.tags.length !== rhs.tags.length))
            return false;
        for (let i = 0; i < this.tags.length; i++)
            if (!tagsEqual(this.tags[i], rhs.tags[i]))
                return false;
        return true;
    }
    static fromObject(object) {
        return new QueryTuple(object.tags);
    }
    toQueryString() {
        return queryTupleToString(this);
    }
}
exports.QueryTuple = QueryTuple;
function queryTupleToString(tuple) {
    const out = [];
    for (const tag of tuple.tags) {
        out.push(queryTagToString(tag));
    }
    return out.join(' ');
}
exports.queryTupleToString = queryTupleToString;
function queryTagToString(tag) {
    let attr = tag.attr;
    if (attr === '*')
        return '*';
    let out = '';
    if (tag.isFlag)
        out += '--';
    if (tag.identifier) {
        if (tag.identifier === attr)
            out += '$';
        else
            out += `[$${tag.identifier}] `;
    }
    out += attr;
    if (tag.isOptional)
        out += '?';
    if (tag.value.t !== 'no_value') {
        out += `=`;
        out += (0, TaggedValue_1.taggedToString)(tag.value);
    }
    return out;
}
exports.queryTagToString = queryTagToString;
function toQueryTuple(step, ctx = {}) {
    if (step.t === 'queryTuple')
        return step;
    if (typeof step === 'function') {
        if (!ctx.graph)
            throw new Error("Can't prepare a mounted function without a graph");
        const mount = (0, QuickMount_1.javascriptQuickMountIntoGraph)(ctx.graph, step);
        const tags = [
            { t: 'tag', attr: 'join', value: { t: 'no_value' } }
        ];
        for (const [attrName, attrConfig] of Object.entries(mount.attrs)) {
            tags.push({ t: 'tag', attr: attrName, value: { t: 'no_value' } });
        }
        return new QueryTuple(tags);
    }
    if (typeof step === 'string') {
        const parsed = (0, parseQueryTuple_1.parseQueryTuple)(step);
        if (parsed.t === 'parseError')
            throw new Error("parse error: " + parsed.message);
        return parsed;
    }
    const looseStep = step;
    if (looseStep.attrs)
        return QueryTuple.fromItem(looseStep.attrs);
    throw new Error("step is missing .attrs");
}
exports.toQueryTuple = toQueryTuple;
//# sourceMappingURL=QueryTuple.js.map