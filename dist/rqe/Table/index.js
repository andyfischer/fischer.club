"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const randomHex_1 = require("../utils/randomHex");
const Graph_1 = require("../Graph");
const Schema_1 = require("../Schema");
const TableIndex_1 = __importDefault(require("./TableIndex"));
const IDSource_1 = require("../utils/IDSource");
const formatItem_1 = require("../format/formatItem");
const assert_1 = require("../utils/assert");
const config_1 = require("../config");
const Errors_1 = require("../Errors");
const Debug_1 = require("../Debug");
const ObjectHeader_1 = require("./ObjectHeader");
const Stream_1 = require("../Stream");
const TableFormatter_1 = require("../format/TableFormatter");
const Item_1 = require("../Item");
const receiveStream_1 = require("./receiveStream");
const Listeners_1 = require("../Listeners");
const ConfigFrequentValidation = true;
function* iteratorMap(it, callback) {
    for (const item of it)
        return callback(item);
}
function parseAttrList(attrSet) {
    const map = new Map();
    if (Array.isArray(attrSet))
        for (const attr of attrSet)
            map.set(attr, true);
    else
        map.set(attrSet, true);
    return map;
}
function toArray(looseList) {
    if (typeof looseList === 'string')
        return [looseList];
    return looseList;
}
function attrSetsEqual(a, b) {
    if (a.size !== b.size)
        return false;
    for (const key of Object.keys(a))
        if (!b.get(key))
            return false;
    return true;
}
function parseWhereFilter(input) {
    const out = {
        conditions: []
    };
    for (const k in input) {
        out.conditions.push({
            attr: k,
            value: input[k]
        });
    }
    return out;
}
function objectToMap(obj) {
    const map = new Map();
    for (const k in obj) {
        if (k === 'rowinfo')
            continue;
        map.set(k, obj[k]);
    }
    return map;
}
function listToMap(list) {
    const map = new Map();
    for (const item of list)
        map.set(item, true);
    return map;
}
class Table {
    constructor(looseSchema, setupOptions = {}) {
        this.t = 'table';
        this.items = new Map();
        this.indexes = [];
        this.indexesBySingleAttr = new Map();
        this.constraints = [];
        this.generatedValues = [];
        this.references = [];
        this.nextInternalID = new IDSource_1.IDSourceNumber();
        const schema = (0, Schema_1.fixLooseSchema)(looseSchema);
        Object.freeze(schema.funcs);
        Object.freeze(schema);
        this.owner = setupOptions.owner;
        this.name = schema.name;
        this.schema = schema;
        this.tableId = setupOptions.tableId;
        for (const [attr, attrConfig] of Object.entries(schema.attrs || {})) {
            Object.freeze(attrConfig);
            if (attrConfig.index) {
                this._newIndex({ attrs: [attr] });
            }
            if (attrConfig.unique) {
                this.addUniqueConstraint([attr], attrConfig.unique.onConflict);
            }
            if (attrConfig.required) {
                this.constraints.push({
                    constraintType: 'required_attr',
                    attr,
                });
            }
            if (attrConfig.reference) {
                this.addReference(attr, attrConfig.reference.onDelete);
            }
            if (attrConfig.foreignKey) {
                this.addForeignKey(attr, attrConfig.foreignKey.table, attrConfig.foreignKey.foreignAttr, attrConfig.foreignKey.onDelete || 'set_null');
            }
            if (attrConfig.generate) {
                this.generatedValues.push({
                    attr,
                    prefix: attrConfig.generate.prefix || '',
                    method: attrConfig.generate.method || 'random',
                    length: attrConfig.generate.length || 6,
                    nextId: 1
                });
            }
        }
        for (const indexConfig of (schema.indexes || [])) {
            Object.freeze(indexConfig);
            if (typeof indexConfig === 'string')
                this._newIndex({ attrs: [indexConfig] });
            else
                this._newIndex(indexConfig);
        }
        for (const referenceConfig of schema.references || []) {
            this.references.push(referenceConfig);
        }
        for (const foreignKeyConfig of schema.foreignKeys || []) {
            this.references.push(foreignKeyConfig);
        }
        const [primaryUniqueAttr, _] = (0, Schema_1.findUniqueAttr)(schema);
        this.primaryUniqueAttr = primaryUniqueAttr;
        for (const item of (schema.initialItems || [])) {
            this.put(item);
        }
    }
    size() {
        return this.items.size;
    }
    getEffectiveAttrs() {
        const attrs = {};
        for (const item of this.scan()) {
            for (const key of Object.keys(item))
                attrs[key] = true;
        }
        return Object.keys(attrs);
    }
    _newIndex(config) {
        const index = new TableIndex_1.default(this, config.attrs);
        this.indexes.push(index);
        if (index.attrs.length === 1)
            this.indexesBySingleAttr.set(index.attrs[0], index);
        if (config.unique) {
            const onConflict = config.unique === true ? 'error' : config.unique.onConflict;
            this.constraints.push({
                constraintType: 'unique',
                onConflict,
                index,
            });
        }
        return index;
    }
    count() {
        return this.items.size;
    }
    itemToKey(item) {
        if (this.primaryUniqueAttr) {
            return { [this.primaryUniqueAttr]: item[this.primaryUniqueAttr] };
        }
        console.error(`can't run itemToKey: `, item);
        throw this.usageError('unsupported: itemToKey needs a primaryUniqueAttr');
    }
    findIndex(attrSet) {
        for (const index of this.indexes) {
            if (attrSetsEqual(attrSet, index.attrSet))
                return index;
        }
        return null;
    }
    addUniqueConstraint(attrs, onConflict = 'error') {
        if (this.items.size > 0)
            throw new Error("unsupported: can't add constraint after rows are added");
        const attrSet = parseAttrList(attrs);
        let index = this._addIndex(attrs);
        this.constraints.push({
            constraintType: 'unique',
            onConflict,
            index,
        });
        return this;
    }
    addReference(attr, onDelete) {
        this.references.push({ attr, onDelete });
        return this;
    }
    addForeignKey(attr, table, foreignAttr, onDelete) {
        if (!table.hasIndexForAttrs([foreignAttr])) {
            throw this.usageError(`can't addForeignKey, no index for: ${foreignAttr}`);
        }
        this.references.push({ attr, table, foreignAttr, onDelete });
        return this;
    }
    _addIndex(attrs) {
        const attrSet = parseAttrList(attrs);
        const existing = this.findIndex(attrSet);
        if (existing)
            return existing;
        return this._newIndex({ attrs: toArray(attrs) });
    }
    addIndex(attrs) {
        this._addIndex(attrs);
        return this;
    }
    hasIndexForAttrs(attrs) {
        const item = {};
        for (const attr of attrs)
            item[attr] = null;
        for (const index of this.indexes) {
            if (index.coversItem(item)) {
                return true;
            }
        }
        return false;
    }
    _beforePut(item) {
        for (const generatedId of this.generatedValues) {
            if (item[generatedId.attr])
                continue;
            let value;
            switch (generatedId.method) {
                case 'random':
                    value = generatedId.prefix + (0, randomHex_1.randomHex)(generatedId.length);
                    break;
                case 'increment':
                    value = generatedId.prefix + generatedId.nextId;
                    generatedId.nextId++;
                    break;
                case 'time_put':
                    value = Date.now();
            }
            item[generatedId.attr] = value;
        }
    }
    receive(event) {
        (0, receiveStream_1.tableReceiveStreamEvent)(this, event);
    }
    prepare(newValue) {
        this._beforePut(newValue || {});
        return newValue;
    }
    put(newItem, putInfo) {
        if ((0, ObjectHeader_1.header)(newItem) && (0, ObjectHeader_1.header)(newItem).table)
            newItem = (0, ObjectHeader_1.withoutHeader)(newItem);
        if (ConfigFrequentValidation)
            this.internalValidate();
        this._beforePut(newItem);
        let overwriteItem = null;
        for (const constraint of this.constraints) {
            switch (constraint.constraintType) {
                case 'required_attr':
                    if (!(0, Item_1.has)(newItem, constraint.attr))
                        throw this.usageError("put() failed, missing required attr: " + constraint.attr);
                    break;
                case 'unique': {
                    const indexKey = constraint.index.toKeyUsingItem(newItem);
                    if (!indexKey)
                        continue;
                    const existingItems = constraint.index.data.get(indexKey);
                    if (existingItems) {
                        switch (constraint.onConflict) {
                            case 'drop_new':
                                return existingItems.values().next().value;
                            case 'overwrite':
                                overwriteItem = existingItems.values().next().value;
                                break;
                            case 'error':
                                throw this.usageError(`put() failed, already have an item with ${constraint.index.attrs}=${indexKey}`);
                        }
                    }
                    break;
                }
            }
        }
        let tableInternalKey;
        if (overwriteItem) {
            tableInternalKey = (0, ObjectHeader_1.header)(overwriteItem).tableInternalKey;
            (0, ObjectHeader_1.initRowInfo)(newItem, (0, ObjectHeader_1.header)(overwriteItem));
            this.items.set(tableInternalKey, newItem);
            if ((0, ObjectHeader_1.header)(overwriteItem).referencers) {
                for (const referencer of (0, ObjectHeader_1.header)(overwriteItem).referencers.values()) {
                    referencer.value[referencer.attr] = newItem;
                }
            }
            (0, ObjectHeader_1.clearHeader)(overwriteItem);
        }
        else {
            tableInternalKey = this.nextInternalID.take();
            (0, ObjectHeader_1.initRowInfo)(newItem, {
                table: this,
                tableInternalKey,
            });
            this.items.set(tableInternalKey, newItem);
        }
        (0, assert_1.assert)(tableInternalKey, 'missing tableInternalKey in commit');
        for (const index of this.indexes) {
            if (index.coversItem(newItem)) {
                index.insert(newItem);
            }
        }
        for (const reference of this.references) {
            const attr = reference.attr;
            const fieldValue = newItem[attr];
            if (fieldValue) {
                let referencedObject;
                if (reference.table) {
                    referencedObject = reference.table.getOneByAttrValue(reference.foreignAttr, fieldValue);
                    if (!referencedObject) {
                        throw new Error(`Table${reference.table.name ? (' ' + reference.table.name) : ''}`
                            + ` doesn't have a value for`
                            + ` ${reference.foreignAttr}=${fieldValue}`);
                    }
                }
                else {
                    referencedObject = fieldValue;
                }
                const referencedHeader = (0, ObjectHeader_1.header)(referencedObject);
                if (!referencedHeader)
                    throw this.usageError(`Value at ${attr} isn't a referenceable object`);
                if (!referencedHeader.referencers)
                    referencedHeader.referencers = new Map();
                const globalId = (0, ObjectHeader_1.itemGlobalId)(referencedHeader);
                referencedHeader.referencers.set(globalId, {
                    value: newItem,
                    attr,
                    onDelete: reference.onDelete
                });
            }
        }
        if (this.itemChangeListeners) {
            const itemData = (0, ObjectHeader_1.withoutHeader)(newItem);
            for (const listener of (this.itemChangeListeners || [])) {
                listener({ verb: 'put', item: itemData, writer: putInfo && putInfo.writer });
            }
        }
        if (this.listenerStreams) {
            const itemData = (0, ObjectHeader_1.withoutHeader)(newItem);
            let anyClosed = false;
            for (const listener of (this.listenerStreams || [])) {
                if (listener.isDone()) {
                    anyClosed = true;
                    continue;
                }
                listener.receive({ t: 'item', item: itemData });
            }
            if (anyClosed)
                this.listenerStreams = this.listenerStreams.filter(s => !s.isDone());
        }
        if (ConfigFrequentValidation)
            this.internalValidate();
        return newItem;
    }
    putItems(items) {
        for (const item of items)
            this.put(item);
    }
    putError(item) {
        if (!this._errors)
            this._errors = (0, Errors_1.newErrorTable)();
        this._errors.put(item);
    }
    putHeader(item) {
        if (!this._headers)
            this._headers = new Table({});
        this._headers.put(item);
    }
    *where(where) {
        if (!where) {
            yield* this.scan();
            return;
        }
        const itemHeader = (0, ObjectHeader_1.header)(where);
        if (itemHeader && itemHeader.table === this) {
            yield where;
            return;
        }
        const attrs = Array.from(Object.keys(where));
        const attrsMap = objectToMap(where);
        for (const index of this.indexes) {
            if (index.matchesAttrList(attrs)) {
                yield* index.get(attrsMap);
                return;
            }
        }
        let message = `where() can't lookup by: [${attrs}]`;
        if (config_1.MemoryTableExtraErrorMessages) {
            if (this.indexes.length === 0) {
                message += `\n - Table ${this.name} has no indexes`;
            }
            else {
                message += `\n - Table ${this.name} has indexes for:`;
                for (const index of this.indexes) {
                    message += `\n     [${index.attrs.toString()}]`;
                }
            }
        }
        throw this.usageError(message);
    }
    replaceAll(items) {
        this.deleteAll();
        for (const item of items)
            this.put(item);
    }
    getOneByAttrValue(attr, value) {
        const index = this.indexesBySingleAttr.get(attr);
        if (!index)
            throw this.usageError("can't getOneByAttrValue, no index for: " + attr);
        const key = new Map();
        key.set(attr, value);
        return index.getOne(key);
    }
    getOne(where) {
        for (const found of this.where(where)) {
            return found;
        }
        return null;
    }
    has(where) {
        return this.getOne(where) != null;
    }
    list() {
        return Array.from(this.items.values());
    }
    toMap(byAttr) {
        const map = new Map();
        for (const item of this.scan()) {
            map.set((0, Item_1.get)(item, byAttr), item);
        }
        return map;
    }
    *[Symbol.iterator]() {
        yield* this.scan();
    }
    *scan() {
        for (const item of this.items.values()) {
            yield item;
        }
    }
    *scanWhere(where) {
        for (const item of this.scan()) {
            let match = true;
            for (const [attr, expectedValue] of Object.entries(where)) {
                if (item[attr] !== expectedValue) {
                    match = false;
                    break;
                }
            }
            if (match)
                yield item;
        }
    }
    *column(attr) {
        for (const item of this.scan()) {
            yield item[attr];
        }
    }
    columnList(attr) {
        return Array.from(this.column(attr));
    }
    columnAsSet(attr) {
        const asSet = new Set();
        for (const value of this.column(attr))
            asSet.add(value);
        return asSet;
    }
    one(where) {
        if (!where) {
            for (const item of this.scan())
                return item;
            return null;
        }
        for (const item of this.where(where))
            return item;
        return null;
    }
    listWhere(where) {
        return Array.from(this.where(where));
    }
    update(where, updater, changeInfo) {
        for (const item of this.where(where)) {
            for (const index of this.indexes) {
                if (index.coversItem(item))
                    index.remove(item);
            }
            updater(item);
            for (const index of this.indexes) {
                if (index.coversItem(item))
                    index.insert(item);
            }
            for (const listener of (this.itemChangeListeners || [])) {
                listener({ verb: 'update', item, writer: changeInfo && changeInfo.writer });
            }
            let anyClosed = false;
            for (const listener of (this.listenerStreams || [])) {
                if (listener.isDone()) {
                    anyClosed = true;
                    continue;
                }
                listener.receive({ t: 'item', item });
            }
            if (anyClosed)
                this.listenerStreams = this.listenerStreams.filter(s => !s.isDone());
        }
    }
    _deleteOne(item, changeInfo) {
        const itemHeader = (0, ObjectHeader_1.header)(item);
        (0, assert_1.assert)(itemHeader, '_deleteOne item has no header');
        (0, assert_1.assert)(itemHeader.tableInternalKey, '_deleteOne item has no tableInternalKey');
        this.items.delete(itemHeader.tableInternalKey);
        for (const index of this.indexes) {
            if (index.coversItem(item)) {
                index.remove(item);
            }
        }
        if (itemHeader.referencers) {
            const referencers = itemHeader.referencers;
            itemHeader.referencers = null;
            for (const referencer of referencers.values()) {
                const resolution = referencer.onDelete;
                const referencerHeader = (0, ObjectHeader_1.header)(referencer.value);
                switch (resolution) {
                    case 'cascade': {
                        const referencerTable = referencerHeader && referencerHeader.table;
                        if (referencerTable) {
                            referencerTable.delete(referencer.value);
                        }
                        break;
                    }
                    case 'set_null':
                        referencer.value[referencer.attr] = null;
                        break;
                }
            }
        }
        (0, ObjectHeader_1.clearHeader)(item);
        if (this.itemChangeListeners) {
            for (const listener of (this.itemChangeListeners || [])) {
                listener({ verb: 'delete', item, writer: changeInfo && changeInfo.writer });
            }
        }
        let anyClosed = false;
        for (const listener of (this.listenerStreams || [])) {
            if (listener.isDone()) {
                anyClosed = true;
                continue;
            }
            listener.receive({ t: 'delete', item });
        }
        if (anyClosed)
            this.listenerStreams = this.listenerStreams.filter(s => !s.isDone());
    }
    delete(where, changeInfo) {
        if (ConfigFrequentValidation)
            this.internalValidate();
        for (const found of this.where(where)) {
            this._deleteOne(found, changeInfo);
        }
        if (ConfigFrequentValidation)
            this.internalValidate();
    }
    deleteAll() {
        this.delete(null);
    }
    addChangeListener(listener) {
        this.itemChangeListeners = this.itemChangeListeners || [];
        this.itemChangeListeners.push(listener);
    }
    startListenerStream(step) {
        const stream = new Stream_1.Stream(this.owner, 'listening to table: ' + this.name);
        stream.receive({ t: 'patch_mode' });
        this.listenerStreams = this.listenerStreams || [];
        this.listenerStreams.push(stream);
        if (step) {
            (0, Listeners_1.trackNewListenStream)(step, stream);
        }
        return stream;
    }
    internalValidate() {
        for (const [tableInternalKey, item] of this.items.entries()) {
            const itemHeader = (0, ObjectHeader_1.header)(item);
            if (itemHeader.table !== this) {
                throw new Error("item header .table is wrong: " + JSON.stringify(item));
            }
        }
    }
    usageError(message) {
        if (this.name)
            message = `[table ${this.name}] ${message}`;
        return new Error(message);
    }
    hasError() {
        return this._errors && this._errors.count() > 0;
    }
    errors() {
        return this._errors;
    }
    errorsToException() {
        return (0, Errors_1.newErrorFromItems)(this._errors.list());
    }
    throwErrors() {
        if (this.hasError()) {
            throw this.errorsToException();
        }
    }
    rebuildIndexes() {
        for (const index of this.indexes)
            index.rebuild();
    }
    query(queryLike, parameters = {}, context = {}) {
        const graph = new Graph_1.Graph();
        graph.addTable(this, { readonly: context.readonly });
        return graph.query(queryLike, parameters, context);
    }
    str() {
        return (0, Debug_1.tableSchemaToString)(this);
    }
    strs() {
        const out = [];
        if (this.hasError()) {
            for (const error of this._errors.scan()) {
                out.push('# ' + (0, Errors_1.errorItemToOneLineString)(error));
            }
        }
        for (const item of this.scan())
            out.push((0, formatItem_1.formatItem)(item));
        return out;
    }
    dump() {
        let out = [];
        out.push(`[${this.name}]`);
        for (const line of (0, TableFormatter_1.formatTable)(this)) {
            out.push(line);
        }
        return out.join('\n');
    }
}
exports.Table = Table;
//# sourceMappingURL=index.js.map