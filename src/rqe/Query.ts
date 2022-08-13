
import { parseQuery } from './parser/parseQuery'
import { Graph } from './Graph'
import { QueryTuple, toQueryTuple, QueryStepLike, LooseQueryVerbStep,
    QueryTupleAsObject } from './QueryTuple'
import { shouldCheck } from './FailureTracking'
import { Stream } from './Stream'

export type QueryLike = string | Query | QueryAsObject |
    LoosePipedQuery | QueryStepLike | QueryStepLike[] | QueryTuple | QueryTupleAsObject

export interface QueryParameters {
    '$input'?: Stream
    [name: string]: any
}

export interface LoosePipedQuery {
    steps: LooseQueryVerbStep[]
}

interface QueryPrepareContext {
    graph?: Graph
    expectTransform?: boolean
}

function looseStepsListToQuery(ctx: QueryPrepareContext, steps: QueryStepLike[]) {
    return new Query(steps.map(step => toQueryTuple(step, ctx)));
}

export interface QueryAsObject {
    t: 'queryObject'
    isTransform: boolean
    steps: QueryTupleAsObject[]
}

export interface QueryModifier {
    with?: string | string[]
    without?: string | string[]
}

export function toQuery(queryLike: QueryLike, ctx: QueryPrepareContext = {}): Query {
    if ((queryLike as any).t === 'query')
        // Already is a valid Query
        return queryLike as Query;

    if ((queryLike as any).t === 'queryTuple') {
        queryLike = queryLike as QueryTuple;
        return new Query([queryLike], { isTransform: ctx.expectTransform });
    }

    if ((queryLike as any).t === 'queryObject') {
        return Query.fromObject(queryLike as any as QueryAsObject);
    }

    if ((queryLike as any).t === 'queryTupleObject') {
        return new Query([QueryTuple.fromObject(queryLike as any as QueryTupleAsObject)]);
    }

    if (typeof queryLike === 'string') {
        // Parse string
        const parsed = parseQuery(queryLike, { expectTransform: ctx.expectTransform });

        if (parsed.t === 'parseError') {
            throw new Error("Parse error: " + parsed.message);
        }

        return parsed;
    }

    if ((queryLike as LoosePipedQuery).steps) {
        return looseStepsListToQuery(ctx, (queryLike as LoosePipedQuery).steps);
    }

    if (Array.isArray(queryLike)) {
        return looseStepsListToQuery(ctx, queryLike as QueryStepLike[]);
    }

    return looseStepsListToQuery(ctx, [queryLike as LooseQueryVerbStep]);
}

export function queryLikeToString(queryLike: QueryLike): string {
    if (typeof queryLike === 'string')
        return queryLike;

    return toQuery(queryLike).toQueryString();
}

export function queryLikeToSerializable(queryLike: QueryLike): string {
    if (typeof queryLike === 'string')
        return queryLike;

    return toQuery(queryLike).toQueryString();
}

interface QueryConstructorOptions {
    isTransform?: boolean
}

export class Query {
    t: 'query' = 'query'
    isTransform: boolean
    steps: QueryTuple[]

    constructor(steps: QueryTuple[], opts: QueryConstructorOptions = {}) {
        this.steps = steps;
        this.isTransform = opts.isTransform;
    }

    first() {
        return this.steps[0];
    }

    injectParameters(parameters: QueryParameters) {
        return this.remapTuples(tuple => tuple.injectParameters(parameters));
    }

    toQueryString() {
        let prefix = '';

        if (this.isTransform)
            prefix = '| ';

        const steps = [];
        for (const step of this.steps) {
            steps.push(step.toQueryString())
        }

        return prefix + steps.join(' | ');
    }

    remapTuples(callback: (tuple: QueryTuple) => QueryTuple) {
        const steps: QueryTuple[] = [];
        for (const step of this.steps) {
            const newStep = callback(step);
            if (newStep)
                steps.push(newStep);
        }
        return new Query(steps, { isTransform: this.isTransform });
    }

    convertToPut() {
        if (this.steps.length !== 1) {
            throw new Error("Query.convertToPut currently only supports 1-step queries");
        }

        return this.remapTuples(tuple => tuple.convertToPut());
    }

    equals(rhs: Query) {
        if ((this.isTransform !== rhs.isTransform)
            || (this.steps.length !== rhs.steps.length)
            || (this.t !== rhs.t))
            return false;

        for (let i=0; i < this.steps.length; i++)
            if (!this.steps[i].equals(rhs.steps[i]))
                return false;

        return true;
    }

    toObject(): QueryAsObject {
        return {
            t: 'queryObject',
            isTransform: this.isTransform || undefined,
            steps: this.steps.map(step => step.toObject())
        }
    }

    checkFilledParameters(params: QueryParameters) {
        for (const tuple of this.steps)
            tuple.checkFilledParameters(params);
    }

    static fromObject(object: QueryAsObject) {
        const tuples = object.steps.map(step => QueryTuple.fromObject(step));
        return new Query(tuples, object);
    }

    maybeTestObjectSerialization() {
        if (shouldCheck()) {
            const fromObject = Query.fromObject(this.toObject());
            // if (!this.equals(fromObject))
        }
    }
}
