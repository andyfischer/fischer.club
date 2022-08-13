import { IDSource } from './utils/IDSource';
import { Table } from './Table';
import { Stream } from './Stream';
import { Module } from './Module';
import { Step } from './Step';
import { QueryLike, Query, QueryParameters } from './Query';
import { QueryTuple } from './QueryTuple';
import { StoredQuery } from './StoredQuery';
import { MapMountConfig, ObjectMountConfig, ListMountConfig, TableMountConfig } from './mountlib';
import { LooseTableSchema } from './Schema';
import { ItemChangeListener } from './reactive/ItemChangeEvent';
import { Item } from './Item';
import { ItemCallback } from './Setup';
import { QueryPlan } from './Plan';
import { MountPointRef } from './MountPoint';
import { Provider } from './Providers';
import { Failure, FailureAttrs } from './FailureTracking';
import { MountPoint, MountPointSpec } from './MountPoint';
import { EmptyLoggingSubsystem } from './LoggingSubsystem';
import { Verb } from './verbs/_shared';
import { CustomType } from './CustomType';
import { Trace } from './Trace';
import { FutureValue, FutureAttr } from './FutureValue';
import { BuiltinTables } from './BuiltinOptional';
export interface QueryExecutionContext {
    env?: {
        [key: string]: any;
    };
    readonly?: boolean;
    trace?: Trace;
    resourceTags?: string[];
    [key: string]: any;
}
declare type HookNativeFunc = (step: Step) => {
    t: 'continue';
} | {
    t: 'done';
};
export interface Queryable {
    query: (query: QueryLike, params?: QueryParameters) => Stream;
}
export declare class Graph implements Queryable {
    graphId: string;
    anonTableName: IDSource;
    nextTableId: IDSource;
    nextModuleId: IDSource;
    nextListenStreamId: IDSource;
    nextResourceTag: IDSource;
    modules: Module[];
    modulesById: Map<string, Module>;
    tables: Map<string, Table<any>>;
    tablesByName: Map<string, Table<any>>;
    schemaListeners: ItemChangeListener[];
    providerTable: Table<Provider>;
    queryPlanCache: Map<string, QueryPlan>;
    hookNativeFunc?: HookNativeFunc;
    builtins: BuiltinTables;
    silentFailures: boolean;
    failureTable: Table<Failure>;
    logging: EmptyLoggingSubsystem;
    customVerbs: Table<{
        name: string;
        def: Verb;
    }>;
    customTypes: Table<{
        name: string;
        def: CustomType;
    }>;
    constructor();
    setupBrowse(): void;
    enableLogging(): void;
    enablePlanCache(): void;
    tablesIt(): IterableIterator<Table<any>>;
    everyMountPoint(): Generator<MountPoint, void, undefined>;
    getQueryMountMatches(tuple: QueryTuple): Generator<{
        point: MountPoint;
        match: import("./FindMatch").QueryMountMatch;
    }, void, unknown>;
    getMountPoint(ref: MountPointRef): MountPoint;
    findTableByName(name: string): MountPoint;
    providers(): Table<Provider>;
    addTable(table: Table, opts?: TableMountConfig): void;
    newTable<T = any>(schema?: LooseTableSchema): Table<T>;
    createEmptyModule(): Module;
    mount(points: MountPointSpec[]): Module;
    mountMap(config: MapMountConfig): void;
    mountObject(config: ObjectMountConfig): Module;
    mountList(config: ListMountConfig): Module;
    func(decl: string, func: Function): Module;
    funcv2(decl: string, callback: ItemCallback): Module;
    mountTable(table: Table, opts?: TableMountConfig): Module;
    addProvider(run: (q: Query, i: Stream) => Stream): Provider;
    addSchemaListener(listener: ItemChangeListener, { backlog }?: {
        backlog?: boolean;
    }): void;
    addCustomVerb(name: string, def: Verb): void;
    getVerb(name: string): Verb;
    addCustomType(name: string, def: CustomType): void;
    getCustomType(name: string): CustomType;
    onModuleChange(): void;
    query(queryLike: QueryLike, parameters?: QueryParameters, context?: QueryExecutionContext): Stream;
    one(queryLike: QueryLike, parameters?: QueryParameters, context?: QueryExecutionContext): FutureValue;
    oneAttr(attr: string, queryLike: string, parameters?: QueryParameters, context?: QueryExecutionContext): FutureAttr;
    transform(queryLike: QueryLike, items: Item[], parameters?: QueryParameters, context?: QueryExecutionContext): Stream;
    trace(queryLike: QueryLike, parameters?: QueryParameters): {
        output: Stream;
        trace: Trace;
    };
    put(object: any): Stream;
    logTrace(queryLike: QueryLike, parameters?: QueryParameters): void;
    applyTransform(items: Item[], queryLike: QueryLike): Stream;
    planQuery(queryLike: QueryLike, context?: QueryExecutionContext): QueryPlan;
    prepareQuery(queryLike: QueryLike): Query;
    prepareTransform(queryLike: QueryLike): Query;
    callMountPoint(context: QueryExecutionContext, pointRef: MountPointRef, tuple: QueryTuple, input: Stream, output: Stream): void;
    callPrepared(prepared: StoredQuery, values: {
        [attr: string]: any;
    }): Stream;
    recordFailure(failure_id: string, attrs?: FailureAttrs): string;
    isAltImplEnabled(name: string): boolean;
    setAlternateImplEnabled(name: string, enabled: boolean): void;
    newStream(label?: string): Stream;
    newGraph(): Graph;
    str(options?: {
        reproducible?: boolean;
    }): string;
}
export declare function newGraph(): Graph;
export {};
