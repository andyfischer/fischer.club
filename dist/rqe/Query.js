"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.queryLikeToSerializable = exports.queryLikeToString = exports.toQuery = void 0;
const parseQuery_1 = require("./parser/parseQuery");
const QueryTuple_1 = require("./QueryTuple");
const FailureTracking_1 = require("./FailureTracking");
function looseStepsListToQuery(ctx, steps) {
    return new Query(steps.map(step => (0, QueryTuple_1.toQueryTuple)(step, ctx)));
}
function toQuery(queryLike, ctx = {}) {
    if (queryLike.t === 'query')
        return queryLike;
    if (queryLike.t === 'queryTuple') {
        queryLike = queryLike;
        return new Query([queryLike], { isTransform: ctx.expectTransform });
    }
    if (queryLike.t === 'queryObject') {
        return Query.fromObject(queryLike);
    }
    if (queryLike.t === 'queryTupleObject') {
        return new Query([QueryTuple_1.QueryTuple.fromObject(queryLike)]);
    }
    if (typeof queryLike === 'string') {
        const parsed = (0, parseQuery_1.parseQuery)(queryLike, { expectTransform: ctx.expectTransform });
        if (parsed.t === 'parseError') {
            throw new Error("Parse error: " + parsed.message);
        }
        return parsed;
    }
    if (queryLike.steps) {
        return looseStepsListToQuery(ctx, queryLike.steps);
    }
    if (Array.isArray(queryLike)) {
        return looseStepsListToQuery(ctx, queryLike);
    }
    return looseStepsListToQuery(ctx, [queryLike]);
}
exports.toQuery = toQuery;
function queryLikeToString(queryLike) {
    if (typeof queryLike === 'string')
        return queryLike;
    return toQuery(queryLike).toQueryString();
}
exports.queryLikeToString = queryLikeToString;
function queryLikeToSerializable(queryLike) {
    if (typeof queryLike === 'string')
        return queryLike;
    return toQuery(queryLike).toQueryString();
}
exports.queryLikeToSerializable = queryLikeToSerializable;
class Query {
    constructor(steps, opts = {}) {
        this.t = 'query';
        this.steps = steps;
        this.isTransform = opts.isTransform;
    }
    first() {
        return this.steps[0];
    }
    injectParameters(parameters) {
        return this.remapTuples(tuple => tuple.injectParameters(parameters));
    }
    toQueryString() {
        let prefix = '';
        if (this.isTransform)
            prefix = '| ';
        const steps = [];
        for (const step of this.steps) {
            steps.push(step.toQueryString());
        }
        return prefix + steps.join(' | ');
    }
    remapTuples(callback) {
        const steps = [];
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
    equals(rhs) {
        if ((this.isTransform !== rhs.isTransform)
            || (this.steps.length !== rhs.steps.length)
            || (this.t !== rhs.t))
            return false;
        for (let i = 0; i < this.steps.length; i++)
            if (!this.steps[i].equals(rhs.steps[i]))
                return false;
        return true;
    }
    toObject() {
        return {
            t: 'queryObject',
            isTransform: this.isTransform || undefined,
            steps: this.steps.map(step => step.toObject())
        };
    }
    checkFilledParameters(params) {
        for (const tuple of this.steps)
            tuple.checkFilledParameters(params);
    }
    static fromObject(object) {
        const tuples = object.steps.map(step => QueryTuple_1.QueryTuple.fromObject(step));
        return new Query(tuples, object);
    }
    maybeTestObjectSerialization() {
        if ((0, FailureTracking_1.shouldCheck)()) {
            const fromObject = Query.fromObject(this.toObject());
        }
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map