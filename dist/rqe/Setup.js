"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTableBind = exports.Setup = exports.toMountSpec = void 0;
const Query_1 = require("./Query");
const StoredQuery_1 = require("./StoredQuery");
const Errors_1 = require("./Errors");
const parseTableDecl_1 = require("./parser/parseTableDecl");
function toMountSpec(looseSpec) {
    const attrs = {};
    const result = {
        name: looseSpec.name,
        attrs: {},
        run: looseSpec.run,
    };
    if (typeof looseSpec.attrs === 'string') {
        result.attrs[looseSpec.attrs] = { required: true };
    }
    else if (Array.isArray(looseSpec.attrs)) {
        for (const attr of looseSpec.attrs)
            result.attrs[attr] = { required: true };
    }
    else {
        result.attrs = looseSpec.attrs;
    }
    return result;
}
exports.toMountSpec = toMountSpec;
class Setup {
    constructor() {
        this.attrs = {};
        this.children = [];
    }
    bind(looseSpec) {
        if (typeof looseSpec !== 'object')
            throw new Errors_1.TableImplementationError('table() expected object input');
        const spec = toMountSpec(looseSpec);
        const child = new Setup();
        child.parent = this;
        child.attrs = {};
        const { name, attrs } = spec;
        if (name) {
            child.tableName(name);
        }
        for (const [attr, attrConfig] of Object.entries(attrs)) {
            child.attrs[attr] = attrConfig;
        }
        for (const [attr, attrConfig] of Object.entries(child.attrs)) {
            if (attrConfig.assumeInclude && attrConfig.required) {
                throw new Error("attr should not be assumeInclude=true and required=true");
            }
            if (attrConfig.assumeInclude)
                attrConfig.required = false;
            if (attrConfig.required == undefined)
                attrConfig.required = true;
        }
        this.children.push(child);
        if (spec.run) {
            child.runCallback = spec.run;
        }
        return child;
    }
    table(params) {
        return this.bind(params);
    }
    mount(decl, callback) {
        const bind = toTableBind(decl, callback);
        this.bind(bind);
    }
    tableName(name) {
        this._tableName = name;
        return this;
    }
    get(callback) {
        if (this.runCallback) {
            throw new Error("already have a 'run' callback");
        }
        this.runCallback = callback;
        return this;
    }
    run(callback) {
        if (this.runCallback) {
            throw new Error("already have a 'run' callback");
        }
        this.runCallback = callback;
        return this;
    }
    put(callback) {
        const subTable = this.table({ attrs: { put: {} } });
        return subTable.get(callback);
    }
    getAttrsWithInherited() {
        const result = {};
        for (const [key, value] of Object.entries(this.attrs))
            result[key] = value;
        let parent = this.parent;
        let recursionLimit = 1000;
        while (parent) {
            if (recursionLimit-- <= 0)
                throw new Error("internal error: too many loops in getAttrsWithInherited");
            for (const [attr, attrConfig] of Object.entries(parent.attrs)) {
                if (!result[attr])
                    result[attr] = { ...attrConfig };
            }
            parent = parent.parent;
        }
        return result;
    }
    *iterateChildren() {
        yield this;
        for (const child of this.children) {
            yield* child.iterateChildren();
        }
    }
    toSpecs() {
        const result = [];
        for (const child of this.iterateChildren()) {
            if (child.runCallback) {
                result.push({
                    attrs: child.getAttrsWithInherited(),
                    name: child._tableName,
                    run: child.runCallback
                });
            }
        }
        return result;
    }
    prepareQuery(queryLike) {
        const query = (0, Query_1.toQuery)(queryLike);
        if (query.t !== 'query')
            throw new Error('expected pipedQuery');
        return new StoredQuery_1.StoredQuery(query);
    }
    alias(aliasQuery) {
        this.aliasQuery = aliasQuery;
    }
}
exports.Setup = Setup;
function toList(s) {
    if (Array.isArray(s))
        return s;
    return [s];
}
function toTableBind(decl, callback) {
    const params = (0, parseTableDecl_1.parseTableDecl)(decl);
    params.run = callback;
    return params;
}
exports.toTableBind = toTableBind;
//# sourceMappingURL=Setup.js.map