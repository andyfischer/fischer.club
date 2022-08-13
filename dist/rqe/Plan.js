"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abstractRunStep = exports.createInitialPlannedSteps = exports.createOnePlannedStep = exports.findVerbForTuple = exports.QueryPlan = void 0;
const Step_1 = require("./Step");
const Table_1 = require("./Table");
const Query_1 = require("./Query");
const QueryTuple_1 = require("./QueryTuple");
const Stream_1 = require("./Stream");
const IDSource_1 = require("./utils/IDSource");
const _list_1 = require("./verbs/_list");
const FindMatch_1 = require("./FindMatch");
const Debug_1 = require("./Debug");
const FailureTracking_1 = require("./FailureTracking");
class QueryPlan {
    constructor(graph, query, context = {}) {
        this.stepIds = new IDSource_1.IDSourceNumber();
        if (!graph)
            throw new Error("missing: graph");
        this.graph = graph;
        this.query = query;
        this.trace = context.trace;
        this.prepare();
    }
    prepare() {
        if (this.trace)
            this.trace.open('planning');
        createInitialPlannedSteps(this);
        handlePlanTimeVerbs(this);
        optimizeForProviders(this);
        findMatchesForCertainVerbs(this);
        if (this.trace)
            this.trace.close('planning');
    }
    getExpectedOutput() {
        var _a;
        if (this.steps.length === 0)
            return null;
        return (_a = this.steps[this.steps.length - 1].expectedResult) === null || _a === void 0 ? void 0 : _a.output;
    }
    getPrepareErrors() {
        var _a;
        const out = new Table_1.Table({});
        for (const step of this.steps) {
            for (const error of ((_a = step.expectedResult) === null || _a === void 0 ? void 0 : _a.errors) || []) {
                out.put({
                    ...error,
                    step: step.id,
                    phase: 'prepare',
                });
            }
        }
        return out;
    }
    str() {
        return (0, Debug_1.planToString)(this);
    }
}
exports.QueryPlan = QueryPlan;
function findVerbForTuple(graph, tuple, expectedInput) {
    var _a;
    const verbName = (_a = tuple.tags[0]) === null || _a === void 0 ? void 0 : _a.attr;
    if (!verbName)
        throw new Error("no verb name found");
    const afterVerb = tuple.withoutFirstTag();
    const foundBuiltin = (0, _list_1.getVerb)(verbName);
    if (foundBuiltin)
        return { verbDef: foundBuiltin, afterVerb };
    if (graph.customVerbs) {
        const foundCustom = graph.customVerbs.one({ name: verbName });
        if (foundCustom)
            return { verbDef: foundCustom.def, afterVerb };
    }
    switch (expectedInput.t) {
        case 'no_value':
            return { verbDef: (0, _list_1.getVerb)('get'), afterVerb: tuple };
        case 'expected_value':
        case 'some_value':
            return { verbDef: (0, _list_1.getVerb)('join'), afterVerb: tuple };
        default:
            throw new Error('unrecognized expectedInput: ' + expectedInput.t);
    }
    throw new Error("couldn't find a verb");
}
exports.findVerbForTuple = findVerbForTuple;
function createOnePlannedStep(plannedQuery, tuple, expectedInput) {
    const graph = plannedQuery.graph;
    if (!graph)
        throw new Error("missing: graph");
    const id = plannedQuery.stepIds.take();
    const { verbDef, afterVerb } = findVerbForTuple(graph, tuple, expectedInput);
    const step = {
        id,
        tuple,
        plannedQuery,
        verbDef,
        afterVerb,
        expectedInput,
        expectedResult: null,
    };
    step.expectedResult = abstractRunStep(plannedQuery, step);
    return step;
}
exports.createOnePlannedStep = createOnePlannedStep;
function replaceOnePlannedStep(plannedQuery, steps, stepIndex, newTuple) {
    let expectedInput;
    if (stepIndex === 0) {
        if (plannedQuery.query.isTransform) {
            expectedInput = { t: 'some_value' };
        }
        else {
            expectedInput = { t: 'no_value' };
        }
    }
    else {
        expectedInput = steps[stepIndex - 1].expectedResult.output;
    }
    steps[stepIndex] = createOnePlannedStep(plannedQuery, newTuple, expectedInput);
}
function createInitialPlannedSteps(plannedQuery) {
    if (!plannedQuery.graph)
        throw new Error("missing: graph");
    const { query } = plannedQuery;
    const steps = [];
    if (query.steps.length === 0) {
        plannedQuery.steps = [];
        return;
    }
    for (let i = 0; i < query.steps.length; i++) {
        let expectedInput;
        if (i === 0) {
            expectedInput = query.isTransform ? { t: 'some_value' } : { t: 'no_value' };
        }
        else {
            expectedInput = steps[i - 1].expectedResult.output;
        }
        const step = createOnePlannedStep(plannedQuery, query.steps[i], expectedInput);
        steps.push(step);
    }
    plannedQuery.steps = steps;
}
exports.createInitialPlannedSteps = createInitialPlannedSteps;
function handlePlanTimeVerbs(plannedQuery) {
    if (!plannedQuery.graph)
        throw new Error("missing plannedQuery.graph");
    const graph = plannedQuery.graph;
    const steps = plannedQuery.steps;
    const fixedSteps = [];
    function bringInAttr(stepIndex, attr) {
        for (; stepIndex >= 0; stepIndex--) {
            const step = steps[stepIndex];
            const expectedOutput = step.expectedResult.output;
            if (expectedOutput && expectedOutput.t === 'expected_value' && expectedOutput.value.has(attr)) {
                return;
            }
            if (step.tuple.has(attr))
                return;
            if (step.verbDef.name === 'get') {
                const enhancedTuple = step.tuple.shallowCopy();
                enhancedTuple.addTag({
                    t: 'tag',
                    attr,
                    value: { t: 'no_value' }
                });
                const existingMatch = (0, FindMatch_1.findBestPointMatch)(graph, plannedQuery.trace, step.tuple);
                const enhancedMatch = (0, FindMatch_1.findBestPointMatch)(graph, plannedQuery.trace, enhancedTuple);
                if (existingMatch && enhancedMatch && existingMatch.point === enhancedMatch.point) {
                    replaceOnePlannedStep(plannedQuery, fixedSteps, stepIndex, enhancedTuple);
                    return;
                }
            }
        }
    }
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
        const step = steps[stepIndex];
        if (step.verbDef.name === 'need') {
            for (const tag of step.tuple.tags)
                bringInAttr(stepIndex - 1, tag.attr);
            continue;
        }
        fixedSteps.push(step);
    }
    plannedQuery.steps = fixedSteps;
}
function optimizeForProviders(plannedQuery) {
    const fixedSteps = [];
    let wipProviderId = null;
    let wipProviderRemoteQuery = null;
    let wipProviderQuery = null;
    function finishInProgressProviderQuery() {
        if (!wipProviderQuery)
            return;
        if (wipProviderRemoteQuery.steps.length === 0) {
            wipProviderId = null;
            wipProviderQuery = null;
            wipProviderRemoteQuery = null;
            return;
        }
        wipProviderQuery.addTag({
            t: 'tag',
            attr: 'query',
            value: wipProviderRemoteQuery,
        });
        const insertStep = createOnePlannedStep(plannedQuery, wipProviderQuery, { t: 'no_value' });
        fixedSteps.push(insertStep);
        wipProviderId = null;
        wipProviderQuery = null;
        wipProviderRemoteQuery = null;
    }
    for (const step of plannedQuery.steps) {
        const providerId = findProviderUsedByStep(plannedQuery, step);
        if (providerId && providerId !== wipProviderId) {
            finishInProgressProviderQuery();
            wipProviderId = providerId;
            wipProviderRemoteQuery = new Query_1.Query([]);
            wipProviderQuery = new QueryTuple_1.QueryTuple([{
                    t: 'tag',
                    attr: 'run_query_with_provider',
                    value: { t: 'no_value' }
                }, {
                    t: 'tag',
                    attr: 'provider_id',
                    value: {
                        t: 'str_value',
                        str: providerId
                    },
                }]);
        }
        if (wipProviderQuery) {
            wipProviderRemoteQuery.steps.push(step.tuple);
        }
        else {
            fixedSteps.push(step);
        }
    }
    finishInProgressProviderQuery();
    plannedQuery.steps = fixedSteps;
}
function findMatchesForCertainVerbs(plannedQuery) {
    for (const step of plannedQuery.steps) {
        if (step.verbDef.name === 'get' || step.verbDef.name === 'join') {
            const match = (0, FindMatch_1.findBestPointMatch)(plannedQuery.graph, plannedQuery.trace, step.tuple);
            if (match) {
                step.staticMatch = {
                    t: 'found',
                    match,
                };
            }
            else {
                step.staticMatch = {
                    t: 'not_found',
                };
            }
        }
    }
}
function findProviderUsedByStep(plannedQuery, step) {
    const providers = new Map();
    for (const usedMountRef of (step.expectedResult.usesMounts || [])) {
        const point = plannedQuery.graph.getMountPoint(usedMountRef);
        providers.set(point.providerId, true);
    }
    if (providers.size > 1)
        (0, FailureTracking_1.recordFailure)('found_multiple_providers', { tuple: step.tuple, graph: plannedQuery.graph });
    const providersList = Array.from(providers.keys());
    return providersList[0];
}
function abstractRunStep(plannedQuery, plannedStep) {
    if (plannedQuery.trace)
        plannedQuery.trace.open('abstractRunStep $tuple', { tuple: plannedStep.tuple });
    const input = new Stream_1.Stream();
    switch (plannedStep.expectedInput.t) {
        case 'expected_value':
            input.put(plannedStep.expectedInput.value.toItemValue());
            break;
        case 'expected_union':
            for (const item of plannedStep.expectedInput.values)
                input.put(item.toItemValue());
            break;
    }
    input.done();
    const outputStream = new Stream_1.Stream();
    const step = new Step_1.Step({
        graph: plannedQuery.graph,
        context: {},
        tuple: plannedStep.tuple,
        afterVerb: plannedStep.afterVerb,
        id: plannedStep.id,
        plannedStep: plannedStep,
        input,
        output: outputStream,
        trace: plannedQuery.trace,
    });
    step.schemaOnly = true;
    plannedStep.verbDef.run(step);
    outputStream.sendDoneIfNeeded();
    const [output, errors] = outputStream.takeItemsAndErrors();
    let expectedOutput;
    if (output && output.length > 1) {
        expectedOutput = {
            t: 'expected_union',
            values: output.map(item => QueryTuple_1.QueryTuple.fromItem(item)),
        };
    }
    else if (output && output[0]) {
        expectedOutput = {
            t: 'expected_value',
            value: QueryTuple_1.QueryTuple.fromItem(output[0]),
        };
    }
    else {
        expectedOutput = {
            t: 'some_value'
        };
    }
    if (plannedQuery.trace)
        plannedQuery.trace.close('abstractRunStep $tuple', { tuple: plannedStep.tuple });
    return {
        output: expectedOutput,
        errors,
        usesMounts: step.sawUsedMounts,
    };
}
exports.abstractRunStep = abstractRunStep;
//# sourceMappingURL=Plan.js.map