
import { Step } from './Step'
import { Table } from './Table'
import { Graph } from './Graph'
import { Query } from './Query'
import { QueryTuple } from './QueryTuple'
import { Stream } from './Stream'
import { ErrorItem } from './Errors'
import { IDSourceNumber as IDSource } from './utils/IDSource'
import { QueryExecutionContext } from './Graph'
import { getVerb } from './verbs/_list'
import { findBestPointMatch, PointMatch } from './FindMatch'
import { planToString } from './Debug'
import { Verb } from './verbs/_shared'
import { MountPointRef } from './MountPoint'
import { Trace } from './Trace'
import { recordFailure } from './FailureTracking'

export interface PlannedStep {
    id: number
    plannedQuery: QueryPlan
    tuple: QueryTuple
    afterVerb: QueryTuple

    verbDef: Verb
    staticMatch?: { t: 'found', match: PointMatch } | { t: 'not_found' }

    expectedInput: ExpectedValue
    expectedResult: ExpectedExecution
}

export interface NoInputExpected {
    t: 'no_value'
}

export interface SomeInputExpected {
    t: 'some_value'
}

export interface ExpectedSingleValue {
    t: 'expected_value'
    value: QueryTuple
}

export interface ExpectedUnionValue {
    t: 'expected_union'
    values: QueryTuple[]
}

export type ExpectedValue = NoInputExpected | SomeInputExpected | ExpectedSingleValue | ExpectedUnionValue

interface ExpectedExecution {
    errors: ErrorItem[]
    output: ExpectedValue
    usesMounts: MountPointRef[]
}

export class QueryPlan {
    graph: Graph
    query: Query
    steps: PlannedStep[]
    stepIds = new IDSource()
    trace?: Trace

    constructor(graph: Graph, query: Query, context: QueryExecutionContext = {}) {
        if (!graph)
            throw new Error("missing: graph");

        this.graph = graph;
        this.query = query;
        this.trace = context.trace;
        this.prepare();
    }

    private prepare() {
        if (this.trace)
            this.trace.open('planning');

        createInitialPlannedSteps(this);
        handlePlanTimeVerbs(this);
        optimizeForProviders(this);
        findMatchesForCertainVerbs(this);

        if (this.trace)
            this.trace.close('planning');
    }

    getExpectedOutput(): ExpectedValue {
        if (this.steps.length === 0)
            return null;

        return this.steps[this.steps.length - 1].expectedResult?.output;
    }

    getPrepareErrors(): Table {
        const out = new Table({});

        for (const step of this.steps) {
            for (const error of step.expectedResult?.errors || []) {
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
        return planToString(this);
    }
}

export function findVerbForTuple(graph: Graph, tuple: QueryTuple, expectedInput: ExpectedValue) {
    const verbName = tuple.tags[0]?.attr;

    if (!verbName)
        throw new Error("no verb name found");

    const afterVerb = tuple.withoutFirstTag();

    const foundBuiltin = getVerb(verbName);
    if (foundBuiltin)
        return { verbDef: foundBuiltin, afterVerb };

    if (graph.customVerbs) {
        const foundCustom = graph.customVerbs.one({ name: verbName });
        if (foundCustom)
            return { verbDef: foundCustom.def, afterVerb }
    }

    // Use default verb - either get or join
    switch (expectedInput.t) {
    case 'no_value':
        return { verbDef: getVerb('get'), afterVerb: tuple };
    case 'expected_value':
    case 'some_value':
        return { verbDef: getVerb('join'), afterVerb: tuple }
    default:
        throw new Error('unrecognized expectedInput: ' + (expectedInput as any).t);
    }

    throw new Error("couldn't find a verb");
}

export function createOnePlannedStep(plannedQuery: QueryPlan, tuple: QueryTuple, expectedInput: ExpectedValue): PlannedStep {

    const graph: Graph = plannedQuery.graph;

    if (!graph)
        throw new Error("missing: graph");

    const id = plannedQuery.stepIds.take();

    // Find the verb def.
    const { verbDef, afterVerb } = findVerbForTuple(graph, tuple, expectedInput);

    const step: PlannedStep = {
        id,
        tuple,
        plannedQuery,
        verbDef,
        afterVerb,
        expectedInput,
        expectedResult: null,
    }

    // Evaluate schema
    step.expectedResult = abstractRunStep(plannedQuery, step);

    return step;
}

function replaceOnePlannedStep(plannedQuery: QueryPlan, steps: PlannedStep[], stepIndex: number, newTuple: QueryTuple) {

    let expectedInput;

    if (stepIndex === 0) {
        if (plannedQuery.query.isTransform) {
            expectedInput = { t: 'some_value' }
        } else {
            expectedInput = { t: 'no_value' }
        }
    } else {
        expectedInput = steps[stepIndex - 1].expectedResult.output;
    }

    steps[stepIndex] = createOnePlannedStep(plannedQuery, newTuple, expectedInput);
}

export function createInitialPlannedSteps(plannedQuery: QueryPlan) {
    if (!plannedQuery.graph)
        throw new Error("missing: graph");

    const { query } = plannedQuery;

    const steps: PlannedStep[] = [];

    if (query.steps.length === 0) {
        plannedQuery.steps = [];
        return;
    }

    for (let i=0; i < query.steps.length; i++) {

        let expectedInput: ExpectedValue;

        if (i === 0) {
            expectedInput = query.isTransform ? { t: 'some_value' } : { t: 'no_value' };
        } else {
            expectedInput = steps[i - 1].expectedResult.output;
        }

        const step = createOnePlannedStep(plannedQuery, query.steps[i], expectedInput);

        steps.push(step);
    }

    plannedQuery.steps = steps;
}

function handlePlanTimeVerbs(plannedQuery: QueryPlan) {
    if (!plannedQuery.graph)
        throw new Error("missing plannedQuery.graph");

    const graph = plannedQuery.graph;
    const steps = plannedQuery.steps;
    const fixedSteps: PlannedStep[] = [];

    function bringInAttr(stepIndex: number, attr: string) {
        for (; stepIndex >= 0; stepIndex--) {
            const step = steps[stepIndex];

            // Check if the step's output already has this attr.
            const expectedOutput = step.expectedResult.output;
            if (expectedOutput && expectedOutput.t === 'expected_value' && expectedOutput.value.has(attr)) {
                // The attr is already here, we're good.
                return;
            }

            if (step.tuple.has(attr))
                return;

            // Try to pull the attr from this table.
            if (step.verbDef.name === 'get') {
                const enhancedTuple = step.tuple.shallowCopy();
                enhancedTuple.addTag({
                    t: 'tag',
                    attr,
                    value: { t: 'no_value' }
                });

                const existingMatch = findBestPointMatch(graph, plannedQuery.trace, step.tuple);
                const enhancedMatch = findBestPointMatch(graph, plannedQuery.trace, enhancedTuple);

                // If we still matched to the same table then we're good to enhance this step.
                if (existingMatch && enhancedMatch && existingMatch.point === enhancedMatch.point) {
                    replaceOnePlannedStep(plannedQuery, fixedSteps, stepIndex, enhancedTuple);
                    return;
                }
            }
        }

        // Failed to bring in the attr - TODO is record an error.
    }

    // Handle 'need' verbs
    for (let stepIndex=0; stepIndex < steps.length; stepIndex++) {
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

function optimizeForProviders(plannedQuery: QueryPlan) {
    // - Iterate across the PlannedSteps
    // - Check to see if any steps use mounts that have a providerId. We figure this out by
    //   looking at the block AST.
    // - If so, those steps are converted (and grouped, if multiple) into a run_query_with_provider step.

    const fixedSteps: PlannedStep[] = [];
    let wipProviderId: string = null;
    let wipProviderRemoteQuery: Query = null;
    let wipProviderQuery: QueryTuple = null;

    function finishInProgressProviderQuery() {
        if (!wipProviderQuery)
            return;

        if (wipProviderRemoteQuery.steps.length === 0) {
            wipProviderId = null;
            wipProviderQuery = null;
            wipProviderRemoteQuery = null;
            return;
        }

        // Save the wipProviderQuery that was in progress.
        wipProviderQuery.addTag({
            t: 'tag',
            attr: 'query',
            value: wipProviderRemoteQuery,
        });

        const insertStep = createOnePlannedStep(plannedQuery, wipProviderQuery, { t: 'no_value' });
        // console.log('created step for provider: ', JSON.stringify(wipProviderQuery, null, 2));
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

            wipProviderRemoteQuery = new Query([]);

            wipProviderQuery = new QueryTuple([{
                t: 'tag',
                attr: 'run_query_with_provider',
                value: { t: 'no_value' }
            },{
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
        } else {
            fixedSteps.push(step);
        }
    }

    finishInProgressProviderQuery();
    plannedQuery.steps = fixedSteps;
}

function findMatchesForCertainVerbs(plannedQuery: QueryPlan) {
    for (const step of plannedQuery.steps) {
        if (step.verbDef.name === 'get' || step.verbDef.name === 'join') {
            const match = findBestPointMatch(plannedQuery.graph, plannedQuery.trace, step.tuple);

            if (match) {
                step.staticMatch = {
                    t: 'found',
                    match,
                }
            } else {
                step.staticMatch = {
                    t: 'not_found',
                }
            }
        }
    }
}

function findProviderUsedByStep(plannedQuery: QueryPlan, step: PlannedStep) {
    const providers = new Map();

    for (const usedMountRef of (step.expectedResult.usesMounts || [])) {
        const point = plannedQuery.graph.getMountPoint(usedMountRef);
        providers.set(point.providerId, true);
    }

    if (providers.size > 1)
        recordFailure('found_multiple_providers', { tuple: step.tuple, graph: plannedQuery.graph });

    const providersList = Array.from(providers.keys());
    return providersList[0];
}

export function abstractRunStep(plannedQuery: QueryPlan, plannedStep: PlannedStep): ExpectedExecution {

    if (plannedQuery.trace)
        plannedQuery.trace.open('abstractRunStep $tuple', { tuple: plannedStep.tuple });

    const input = new Stream();

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

    const outputStream = new Stream();

    const step = new Step({
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
    
    const [ output, errors ] = outputStream.takeItemsAndErrors();

    let expectedOutput: ExpectedValue;

    if (output && output.length > 1) {
        expectedOutput = {
            t: 'expected_union',
            values: output.map(item => QueryTuple.fromItem(item)),
        }
    } else if (output && output[0]) {
        expectedOutput = {
            t: 'expected_value',
            value: QueryTuple.fromItem(output[0]),
        };
    } else {
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
    }
}
