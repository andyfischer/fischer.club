"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTransformationToGraph = exports.applyTransform = exports.toTransformQuery = void 0;
const QuickMount_1 = require("./QuickMount");
const Stream_1 = require("./Stream");
const Query_1 = require("./Query");
const QueryTuple_1 = require("./QueryTuple");
const Runtime_1 = require("./Runtime");
function toTransformQuery(graph, looseQuery) {
    if (looseQuery.t === 'transform')
        return looseQuery;
    looseQuery = looseQuery;
    return {
        t: 'transform',
        steps: looseQuery.map((looseStep) => {
            if (looseStep.verb)
                return looseStep;
            if (typeof looseStep === 'function') {
                if (!graph) {
                    throw new Error("Can't mount a raw function without a valid graph");
                }
                const mount = (0, QuickMount_1.javascriptQuickMountIntoGraph)(graph, looseStep);
                throw new Error('todo: handle function');
            }
            throw new Error('unhandled step in toTransformQuery: ' + looseStep);
        })
    };
}
exports.toTransformQuery = toTransformQuery;
function applyTransform(graph, items, query) {
    const inputAsStream = new Stream_1.Stream();
    const output = (0, Runtime_1.planAndPerformQuery)(graph, query, { '$input': inputAsStream });
    for (const item of items) {
        inputAsStream.put(item);
    }
    inputAsStream.done();
    return output;
}
exports.applyTransform = applyTransform;
function applyTransformationToGraph(graph, transformLike) {
    const transform = (0, Query_1.toQuery)(transformLike);
    const accessStep = transform.steps[0];
    const results = graph.query(transform).sync();
    if (results.hasError()) {
        throw results.errorsToException();
    }
    const matches = graph.getQueryMountMatches(accessStep);
    const deleteStep = accessStep.shallowCopy();
    deleteStep.addTag({ t: 'tag', attr: 'delete!', value: { t: 'no_value' } });
    graph.query(deleteStep);
    for (const item of results) {
        const putStep = QueryTuple_1.QueryTuple.fromItem(item);
        putStep.addTag({ t: 'tag', attr: 'put!', value: { t: 'no_value' } });
        graph.query(putStep);
    }
}
exports.applyTransformationToGraph = applyTransformationToGraph;
//# sourceMappingURL=Transform.js.map