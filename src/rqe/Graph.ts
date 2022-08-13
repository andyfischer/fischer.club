
import { IDSource } from './utils/IDSource'
import { Table } from './Table'
import { Stream } from './Stream'
import { Module } from './Module'
import { Step } from './Step'
import { QueryLike, toQuery, Query, QueryParameters, queryLikeToString } from './Query'
import { QueryTuple } from './QueryTuple'
import { StoredQuery } from './StoredQuery'
import { setupMap, MapMountConfig, setupObject, ObjectMountConfig, getListMount, ListMountConfig,
    getTableMount, TableMountConfig, setupFunction } from './mountlib'
import { LooseTableSchema, fixLooseSchema } from './Schema'
import { ItemChangeListener } from './reactive/ItemChangeEvent'
import { randomHex } from './utils/randomHex'
import { applyTransform } from './Transform'
import { Item } from './Item'
import { setupBrowse } from './mountlib/browseGraph'
import { ItemCallback } from './Setup'
import { QueryPlan } from './Plan'
import { MountPointRef } from './MountPoint'
import { performQuery } from './Runtime'
import { graphToString } from './Debug'
import { Provider, newProviderTable } from './Providers'
import { Failure, recordFailure, FailureAttrs } from './FailureTracking'
import { MountPoint, MountPointSpec } from './MountPoint'
import { setupLoggingSubsystem, EmptyLoggingSubsystem } from './LoggingSubsystem'
import { getQueryMountMatch } from './FindMatch'
import { Verb } from './verbs/_shared'
import { getVerb } from './verbs/_list'
import { runNativeFunc } from './RunNativeFunc'
import { CustomType } from './CustomType'
import { Trace } from './Trace'
import { setupFunctionWithJavascriptMagic } from './JavascriptMagic'
import { FutureValue, FutureAttr } from './FutureValue'
import { BuiltinTables } from './BuiltinOptional'

let _nextGraphID = new IDSource('graph-');

export interface QueryExecutionContext {
    env?: {
        [key: string]: any
    }
    readonly?: boolean
    trace?: Trace
    resourceTags?: string[]
    [key: string]: any
}

type HookNativeFunc = (step: Step) => { t: 'continue' } | { t: 'done' }

export interface Queryable {
    query: (query: QueryLike, params?: QueryParameters) => Stream
}

export class Graph implements Queryable {
    graphId: string
    anonTableName = new IDSource('anontable-');
    nextTableId = new IDSource('table-');
    nextModuleId = new IDSource('module-');
    nextListenStreamId = new IDSource('listen-stream-');
    nextResourceTag = new IDSource('resource-');
    modules: Module[] = [];
    modulesById = new Map<string, Module>();
    tables = new Map<string, Table>()
    tablesByName = new Map<string, Table>()
    schemaListeners: ItemChangeListener[] = []
    providerTable: Table<Provider>
    queryPlanCache: Map<string, QueryPlan>
    hookNativeFunc?: HookNativeFunc

    builtins = new BuiltinTables()

    // Failures
    silentFailures = false
    failureTable: Table<Failure>

    logging = new EmptyLoggingSubsystem()
    customVerbs: Table<{ name: string, def: Verb}>
    customTypes: Table<{ name: string, def: CustomType}>

    constructor() {
        this.graphId = _nextGraphID.take() + randomHex(6);
    }

    // Graph configuration //

    setupBrowse() {
        this.mount(setupBrowse(this));
    }

    enableLogging() {
        setupLoggingSubsystem(this);
    }

    enablePlanCache() {
        if (!this.queryPlanCache)
            this.queryPlanCache = new Map();
    }

    // Browsing //
    
    tablesIt() {
        return this.tables.values();
    }

    *everyMountPoint() {
        for (const module of this.modules)
            yield* module.points;
    }

    *getQueryMountMatches(tuple: QueryTuple) {
        for (const point of this.everyMountPoint()) {
            const match = getQueryMountMatch(null, tuple, point);

            if (match)
                yield {point,match};
        }
    }

    getMountPoint(ref: MountPointRef): MountPoint {
        const module = this.modulesById.get(ref.moduleId);
        if (!module)
            return null;
        return module.pointsById.get(ref.pointId);
    }

    findTableByName(name: string) {
        for (const module of this.modules)
            for (const table of module.points)
                if (table.name === name)
                    return table;
        return null;
    }

    providers(): Table<Provider> {
        if (!this.providerTable)
            this.providerTable = newProviderTable(this);

        return this.providerTable;
    }

    // Table setup //
    addTable(table: Table, opts: TableMountConfig = {}) {
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

    newTable<T = any>(schema?: LooseTableSchema): Table<T> {
        schema = schema || {};
        schema.name = schema.name || this.anonTableName.take();

        schema = fixLooseSchema(schema);
        const tableId = this.nextTableId.take();
        const table = new Table<T>(schema, { tableId });

        this.addTable(table);

        return table;
    }

    // Module setup //
    createEmptyModule() {
        const module = new Module(this);
        this.modules.push(module);
        this.modulesById.set(module.moduleId, module);
        return module;
    }

    mount(points: MountPointSpec[]) {
        const module = this.createEmptyModule();
        module.redefine(points);
        this.onModuleChange();
        return module;
    }

    mountMap(config: MapMountConfig) {
        this.mount(setupMap(config));
    }

    mountObject(config: ObjectMountConfig) {
        return this.mount(setupObject(config));
    }

    mountList(config: ListMountConfig) {
        const module = this.createEmptyModule();
        module.redefine(getListMount(config));
        return module;
    }

    func(decl: string, func: Function) {
        return this.mount([setupFunctionWithJavascriptMagic(decl, func)]);
    }

    funcv2(decl: string, callback: ItemCallback) {
        return this.mount([setupFunction(decl, callback)]);
    }

    mountTable(table: Table, opts: TableMountConfig = {}) {
        const module = this.createEmptyModule();
        module.redefine(getTableMount(table, opts));
        this.onModuleChange();
        return module;
    }

    addProvider(run: (q: Query, i: Stream) => Stream): Provider {
        const provider = this.providers().put({
            runQuery: run
        });
        this.onModuleChange();
        return provider;
    }

    addSchemaListener(listener: ItemChangeListener, { backlog }: { backlog?: boolean } = {}) {
        if (backlog) {
            for (const module of this.modules) {
                module.sendUpdate(listener);
            }
        }

        this.schemaListeners.push(listener);
    }

    addCustomVerb(name: string, def: Verb) {
        if (!this.customVerbs) {
            this.customVerbs = this.newTable({
                funcs: [
                    'name -> def'
                ]
            });
        }
    
        this.customVerbs.put({name, def});
        this.onModuleChange();
    }

    getVerb(name: string) {
        if (this.customVerbs) {
            const foundCustom = this.customVerbs.one({name});
            if (foundCustom)
                return foundCustom.def;
        }

        return getVerb(name);
    }

    addCustomType(name: string, def: CustomType) {
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

        this.customTypes.put({name,def});
        this.onModuleChange();
    }

    getCustomType(name: string) {
        if (this.customTypes) {
            const found = this.customTypes.one({name});
            return found.def;
        }
    }

    onModuleChange() {
        if (this.queryPlanCache)
            this.queryPlanCache.clear();
    }

    // Query //

    query(queryLike: QueryLike, parameters: QueryParameters = {}, context: QueryExecutionContext = {}) {
        if (this.isAltImplEnabled('always_cache_plan'))
            this.enablePlanCache();

        const query = toQuery(queryLike, { graph: this });
        let plan: QueryPlan;
        let queryAsString: string;

        if (this.queryPlanCache) {
            queryAsString = queryLikeToString(queryLike);
            plan = this.queryPlanCache.get(queryAsString);
        }

        if (!plan) {
            plan = new QueryPlan(this, query, context);

            if (this.queryPlanCache) {
                this.queryPlanCache.set(queryAsString, plan);
            }
        }

        return performQuery(plan, parameters, context);
    }

    // Convenience calls on query() //
    one(queryLike: QueryLike, parameters: QueryParameters = {}, context: QueryExecutionContext = {}) {
        const output = this.query(queryLike, parameters, context);
        const value = output.one();
        value.originalQuery = queryLike;
        return value;
    }

    oneAttr(attr: string, queryLike: string, parameters: QueryParameters = {}, context: QueryExecutionContext = {}) {
        const query = attr + ' ' + queryLike;
        const value = this.one(query, parameters, context);
        return value.attr(attr);
    }

    transform(queryLike: QueryLike, items: Item[], parameters: QueryParameters = {}, context: QueryExecutionContext = {}) {
        parameters.$input = Stream.fromList(items);
        return this.query(queryLike, parameters, context);
    }

    trace(queryLike: QueryLike, parameters: QueryParameters = {}) {
        const trace = new Trace();
        const output = this.query(queryLike, parameters, { trace });
        return { output, trace }
    }

    put(object: any): Stream {
        return this.query({
            attrs: {
                ...object,
                'put!': null,
            }
        });
    }

    logTrace(queryLike: QueryLike, parameters: QueryParameters = {}) {
        const trace = new Trace();
        const output = this.query(queryLike, parameters, { trace });
        console.log(trace.str());
    }

    applyTransform(items: Item[], queryLike: QueryLike): Stream {
        return applyTransform(this, items, this.prepareTransform(queryLike));
    }

    // Query preperation //

    planQuery(queryLike: QueryLike, context: QueryExecutionContext = {}) {
        const query = toQuery(queryLike, { graph: this });
        const planned = new QueryPlan(this, query, context);
        return planned;
    }

    prepareQuery(queryLike: QueryLike): Query {
        return toQuery(queryLike, { graph: this });
    }

    prepareTransform(queryLike: QueryLike): Query {
        return toQuery(queryLike, { graph: this });
    }

    callMountPoint(context: QueryExecutionContext, pointRef: MountPointRef, tuple: QueryTuple, input: Stream, output: Stream) {
        runNativeFunc(this, context, pointRef, tuple, input, output);
    }

    callPrepared(prepared: StoredQuery, values: { [attr: string]: any }): Stream {
        const query = prepared.withValues(values);
        return this.query(query);
    }

    // Testing

    recordFailure(failure_id: string, attrs: FailureAttrs = {}) {
        return recordFailure(failure_id, { ...attrs, graph: this });
    }

    isAltImplEnabled(name: string) {
        return this.builtins.altImpl().one({ name })?.enabled;

        if (!this.builtins.has('alt_impl'))
            return false;

        return this.builtins.altImpl().one({ name })?.enabled;
    }

    setAlternateImplEnabled(name: string, enabled: boolean) {
        const item = this.builtins.altImpl().one({ name });
        if (item)
            item.enabled = enabled;
        else
            this.builtins.altImpl().put({ name, enabled });
    }
    
    // Utilities //
    newStream(label?: string) {
        return new Stream(this, label);
    }

    newGraph() {
        return new Graph();
    }

    // Debugging //
    str(options: { reproducible?: boolean } = {}) {
        return graphToString(this, options);
    }
}

export function newGraph() {
    return new Graph();
}
