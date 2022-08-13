
import { Graph, QueryExecutionContext } from './Graph'
import { QueryLike, QueryParameters, QueryModifier } from './Query'
import { Stream } from './Stream'
import { StoredQuery } from './StoredQuery'
import { QueryPlan, PlannedStep } from './Plan'
import { Item } from './Item'
import { ErrorItem } from './Errors'
import { QueryTuple } from './QueryTuple'
import { findAndCallMountPoint } from './Runtime'
import { unwrapTagged } from './TaggedValue'
import { MountPointRef } from './MountPoint'
import { Trace } from './Trace'
import { RunningQuery } from './RunningQuery'

interface ConstructorArgs {
    id?: number
    graph: Graph
    tuple: QueryTuple
    afterVerb: QueryTuple
    input: Stream
    output: Stream
    context: QueryExecutionContext
    planned?: QueryPlan
    plannedStep?: PlannedStep
    running?: RunningQuery
    trace?: Trace
}

export class Step {

    // id (unique within the PreparedQuery)
    id: number
    tuple: QueryTuple
    afterVerb: QueryTuple

    graph: Graph
    input: Stream
    output: Stream
    context: QueryExecutionContext

    planned: QueryPlan
    plannedStep: PlannedStep
    running: RunningQuery

    incomingSchema: Item[]

    schemaOnly: boolean
    sawUsedMounts: MountPointRef[]

    declaredAsync: boolean
    declaredStreaming: boolean

    trace: Trace

    constructor(args: ConstructorArgs) {
        if (!args.context)
            throw new Error("missing .context");

        this.id = args.id;
        this.graph = args.graph;
        this.tuple = args.tuple;
        this.afterVerb = args.afterVerb;
        this.input = args.input;
        this.output = args.output;
        this.planned = args.planned;
        this.plannedStep = args.plannedStep;
        this.running = args.running;
        this.context = args.context;
        this.trace = args.trace;
    }

    has(attr: string) {
        return this.tuple.has(attr);
    }

    hasValue(attr: string) {
        return (this.tuple.getAttr(attr) !== undefined
                && this.tuple.getAttr(attr).value.t !== 'no_value');
    }
    
    getIncomingSchema() {
        return this.plannedStep.expectedInput;
    }

    query(queryLike: QueryLike, parameters: QueryParameters = {}) {
        return this.graph.query(queryLike, parameters, this.context);
    }

    queryRelated(modifier: QueryModifier) {
        return this.query(this.afterVerb.getRelated(modifier));
    }

    one(queryLike: QueryLike, parameters: QueryParameters = {}) {
        return this.graph.one(queryLike, parameters);
    }

    attr(attr: string, queryLike: string, parameters: QueryParameters = {}) {
        return this.graph.oneAttr(attr, queryLike, parameters);
    }

    // renamed to: attr
    oneAttr(attr: string, queryLike: string, parameters: QueryParameters = {}) {
        return this.graph.oneAttr(attr, queryLike, parameters);
    }

    argsQuery(): QueryTuple {
        return this.afterVerb;
    }

    args() {
        const out: any = {};

        const argsQuery = this.argsQuery();

        if (argsQuery) {
            for (const tag of this.argsQuery().tags) {
                out[tag.attr] = this.getOptional(tag.attr, null);
            }
        }

        return out;
    }

    get(attr: string): string | null {
        const tag = this.tuple.getAttr(attr);

        if (!tag)
            throw new Error("No tag for: " + attr);

        const tval = tag && tag.value;

        if (!tval || tval.t === 'no_value')
            throw new Error("No value for: " + attr);

        return unwrapTagged(tval);
    }

    getOptional(attr: string, defaultValue: any) {

        const tag = this.tuple.getAttr(attr);

        if (!tag)
            return defaultValue;

        const tval = tag && tag.value;

        if (!tval || tval.t === 'no_value')
            return defaultValue;

        return unwrapTagged(tval);
    }

    getInt(attr: string) {
        return parseInt(this.get(attr), 10);
    }

    getOptionalInt(attr: string, defaultValue: number) {
        let value = this.getOptional(attr, defaultValue);
        return parseInt(value, 10);
    }

    getEnv(attr: string) {
        if (!this.context || !this.context.env)
            return null;

        const val = this.context.env[attr];
        if (val == null)
            return null;

        return val;
    }

    putHeader(obj: Item) {
        this.output.putHeader(obj);
    }

    put(obj: Item) {
        this.output.put(obj);
    }

    putError(obj: ErrorItem) {
        this.output.putError(obj);
    }

    callPrepared(stored: StoredQuery, values: { [attr: string]: any } = {}) {
        return this.graph.callPrepared(stored, values);
    }

    done() {
        this.output.done();
    }

    async() {
        this.declaredAsync = true;
    }

    streaming() {
        this.declaredStreaming = true;
    }

    findAndCallMountPoint(tuple: QueryTuple, input: Stream, output: Stream) {
        findAndCallMountPoint(this, tuple, input, output);
    }
}



