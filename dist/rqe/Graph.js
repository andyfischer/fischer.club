"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newGraph = exports.Graph = void 0;
const IDSource_1 = require("./utils/IDSource");
const Table_1 = require("./Table");
const Stream_1 = require("./Stream");
const Module_1 = require("./Module");
const Query_1 = require("./Query");
const mountlib_1 = require("./mountlib");
const Schema_1 = require("./Schema");
const randomHex_1 = require("./utils/randomHex");
const Transform_1 = require("./Transform");
const browseGraph_1 = require("./mountlib/browseGraph");
const Plan_1 = require("./Plan");
const Runtime_1 = require("./Runtime");
const Debug_1 = require("./Debug");
const Providers_1 = require("./Providers");
const FailureTracking_1 = require("./FailureTracking");
const LoggingSubsystem_1 = require("./LoggingSubsystem");
const FindMatch_1 = require("./FindMatch");
const _list_1 = require("./verbs/_list");
const RunNativeFunc_1 = require("./RunNativeFunc");
const Trace_1 = require("./Trace");
const JavascriptMagic_1 = require("./JavascriptMagic");
const BuiltinOptional_1 = require("./BuiltinOptional");
let _nextGraphID = new IDSource_1.IDSource('graph-');
class Graph {
    constructor() {
        this.anonTableName = new IDSource_1.IDSource('anontable-');
        this.nextTableId = new IDSource_1.IDSource('table-');
        this.nextModuleId = new IDSource_1.IDSource('module-');
        this.nextListenStreamId = new IDSource_1.IDSource('listen-stream-');
        this.nextResourceTag = new IDSource_1.IDSource('resource-');
        this.modules = [];
        this.modulesById = new Map();
        this.tables = new Map();
        this.tablesByName = new Map();
        this.schemaListeners = [];
        this.builtins = new BuiltinOptional_1.BuiltinTables();
        this.silentFailures = false;
        this.logging = new LoggingSubsystem_1.EmptyLoggingSubsystem();
        this.graphId = _nextGraphID.take() + (0, randomHex_1.randomHex)(6);
    }
    setupBrowse() {
        this.mount((0, browseGraph_1.setupBrowse)(this));
    }
    enableLogging() {
        (0, LoggingSubsystem_1.setupLoggingSubsystem)(this);
    }
    enablePlanCache() {
        if (!this.queryPlanCache)
            this.queryPlanCache = new Map();
    }
    tablesIt() {
        return this.tables.values();
    }
    *everyMountPoint() {
        for (const module of this.modules)
            yield* module.points;
    }
    *getQueryMountMatches(tuple) {
        for (const point of this.everyMountPoint()) {
            const match = (0, FindMatch_1.getQueryMountMatch)(null, tuple, point);
            if (match)
                yield { point, match };
        }
    }
    getMountPoint(ref) {
        const module = this.modulesById.get(ref.moduleId);
        if (!module)
            return null;
        return module.pointsById.get(ref.pointId);
    }
    findTableByName(name) {
        for (const module of this.modules)
            for (const table of module.points)
                if (table.name === name)
                    return table;
        return null;
    }
    providers() {
        if (!this.providerTable)
            this.providerTable = (0, Providers_1.newProviderTable)(this);
        return this.providerTable;
    }
    addTable(table, opts = {}) {
        const schema = table.schema;
        if (this.tablesByName.has(table.name)) {
            throw new Error("Already have a table with name: " + table.name);
        }
        const id = table.tableId || this.nextTableId.take();
        this.tables.set(id, table);
        this.tablesByName.set(table.name, table);
        this.mountTable(table, opts);
        this.onModuleChange();
    }
    newTable(schema) {
        schema = schema || {};
        schema.name = schema.name || this.anonTableName.take();
        schema = (0, Schema_1.fixLooseSchema)(schema);
        const tableId = this.nextTableId.take();
        const table = new Table_1.Table(schema, { tableId });
        this.addTable(table);
        return table;
    }
    createEmptyModule() {
        const module = new Module_1.Module(this);
        this.modules.push(module);
        this.modulesById.set(module.moduleId, module);
        return module;
    }
    mount(points) {
        const module = this.createEmptyModule();
        module.redefine(points);
        this.onModuleChange();
        return module;
    }
    mountMap(config) {
        this.mount((0, mountlib_1.setupMap)(config));
    }
    mountObject(config) {
        return this.mount((0, mountlib_1.setupObject)(config));
    }
    mountList(config) {
        const module = this.createEmptyModule();
        module.redefine((0, mountlib_1.getListMount)(config));
        return module;
    }
    func(decl, func) {
        return this.mount([(0, JavascriptMagic_1.setupFunctionWithJavascriptMagic)(decl, func)]);
    }
    funcv2(decl, callback) {
        return this.mount([(0, mountlib_1.setupFunction)(decl, callback)]);
    }
    mountTable(table, opts = {}) {
        const module = this.createEmptyModule();
        module.redefine((0, mountlib_1.getTableMount)(table, opts));
        this.onModuleChange();
        return module;
    }
    addProvider(run) {
        const provider = this.providers().put({
            runQuery: run
        });
        this.onModuleChange();
        return provider;
    }
    addSchemaListener(listener, { backlog } = {}) {
        if (backlog) {
            for (const module of this.modules) {
                module.sendUpdate(listener);
            }
        }
        this.schemaListeners.push(listener);
    }
    addCustomVerb(name, def) {
        if (!this.customVerbs) {
            this.customVerbs = this.newTable({
                funcs: [
                    'name -> def'
                ]
            });
        }
        this.customVerbs.put({ name, def });
        this.onModuleChange();
    }
    getVerb(name) {
        if (this.customVerbs) {
            const foundCustom = this.customVerbs.one({ name });
            if (foundCustom)
                return foundCustom.def;
        }
        return (0, _list_1.getVerb)(name);
    }
    addCustomType(name, def) {
        if (!this.customTypes) {
            this.customTypes = this.newTable({
                attrs: {
                    name: {},
                    def: {},
                },
                funcs: [
                    'name ->'
                ],
            });
        }
        this.customTypes.put({ name, def });
        this.onModuleChange();
    }
    getCustomType(name) {
        if (this.customTypes) {
            const found = this.customTypes.one({ name });
            return found.def;
        }
    }
    onModuleChange() {
        if (this.queryPlanCache)
            this.queryPlanCache.clear();
    }
    query(queryLike, parameters = {}, context = {}) {
        if (this.isAltImplEnabled('always_cache_plan'))
            this.enablePlanCache();
        const query = (0, Query_1.toQuery)(queryLike, { graph: this });
        let plan;
        let queryAsString;
        if (this.queryPlanCache) {
            queryAsString = (0, Query_1.queryLikeToString)(queryLike);
            plan = this.queryPlanCache.get(queryAsString);
        }
        if (!plan) {
            plan = new Plan_1.QueryPlan(this, query, context);
            if (this.queryPlanCache) {
                this.queryPlanCache.set(queryAsString, plan);
            }
        }
        return (0, Runtime_1.performQuery)(plan, parameters, context);
    }
    one(queryLike, parameters = {}, context = {}) {
        const output = this.query(queryLike, parameters, context);
        const value = output.one();
        value.originalQuery = queryLike;
        return value;
    }
    oneAttr(attr, queryLike, parameters = {}, context = {}) {
        const query = attr + ' ' + queryLike;
        const value = this.one(query, parameters, context);
        return value.attr(attr);
    }
    transform(queryLike, items, parameters = {}, context = {}) {
        parameters.$input = Stream_1.Stream.fromList(items);
        return this.query(queryLike, parameters, context);
    }
    trace(queryLike, parameters = {}) {
        const trace = new Trace_1.Trace();
        const output = this.query(queryLike, parameters, { trace });
        return { output, trace };
    }
    put(object) {
        return this.query({
            attrs: {
                ...object,
                'put!': null,
            }
        });
    }
    logTrace(queryLike, parameters = {}) {
        const trace = new Trace_1.Trace();
        const output = this.query(queryLike, parameters, { trace });
        console.log(trace.str());
    }
    applyTransform(items, queryLike) {
        return (0, Transform_1.applyTransform)(this, items, this.prepareTransform(queryLike));
    }
    planQuery(queryLike, context = {}) {
        const query = (0, Query_1.toQuery)(queryLike, { graph: this });
        const planned = new Plan_1.QueryPlan(this, query, context);
        return planned;
    }
    prepareQuery(queryLike) {
        return (0, Query_1.toQuery)(queryLike, { graph: this });
    }
    prepareTransform(queryLike) {
        return (0, Query_1.toQuery)(queryLike, { graph: this });
    }
    callMountPoint(context, pointRef, tuple, input, output) {
        (0, RunNativeFunc_1.runNativeFunc)(this, context, pointRef, tuple, input, output);
    }
    callPrepared(prepared, values) {
        const query = prepared.withValues(values);
        return this.query(query);
    }
    recordFailure(failure_id, attrs = {}) {
        return (0, FailureTracking_1.recordFailure)(failure_id, { ...attrs, graph: this });
    }
    isAltImplEnabled(name) {
        var _a, _b;
        return (_a = this.builtins.altImpl().one({ name })) === null || _a === void 0 ? void 0 : _a.enabled;
        if (!this.builtins.has('alt_impl'))
            return false;
        return (_b = this.builtins.altImpl().one({ name })) === null || _b === void 0 ? void 0 : _b.enabled;
    }
    setAlternateImplEnabled(name, enabled) {
        const item = this.builtins.altImpl().one({ name });
        if (item)
            item.enabled = enabled;
        else
            this.builtins.altImpl().put({ name, enabled });
    }
    newStream(label) {
        return new Stream_1.Stream(this, label);
    }
    newGraph() {
        return new Graph();
    }
    str(options = {}) {
        return (0, Debug_1.graphToString)(this, options);
    }
}
exports.Graph = Graph;
function newGraph() {
    return new Graph();
}
exports.newGraph = newGraph;
//# sourceMappingURL=Graph.js.map