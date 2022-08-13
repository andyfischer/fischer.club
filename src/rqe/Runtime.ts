
import { QueryPlan } from './Plan'
import { Stream } from './Stream'
import { Step } from './Step'
import { Graph } from './Graph'
import { Query, QueryParameters } from './Query'
import { MountPoint } from './MountPoint'
import { QueryTuple, QueryTag } from './QueryTuple'
import { get, has } from './Item'
import { VerboseFunctionOutputFiltering, BreakOnMatchFailure } from './config'
import { wrapItem, unwrapTagged } from './TaggedValue'
import { findBestPointMatch, PointMatch, findClosestWrongMatches } from './FindMatch'
import { RunningQuery } from './RunningQuery'
import { runNativeFunc } from './RunNativeFunc'
import { wrapStreamInValidator } from './Debug'
import { StreamValidation } from './config'
import { QueryExecutionContext } from './Graph'

export function planAndPerformQuery(graph: Graph, query: Query, parameters: QueryParameters): Stream {
    const planned = new QueryPlan(graph, query, {});
    const running = new RunningQuery(graph, planned, parameters, {});
    return running.output;
}

export function performQuery(plan: QueryPlan, parameters: QueryParameters, context: QueryExecutionContext): Stream {
    const running = new RunningQuery(plan.graph, plan, parameters, context);
    return running.output;
}

export function runQueryWithProvider(graph: Graph, providerId: string, query: Query, input: Stream): Stream {

    if (!graph.providerTable) {
        const out = graph.newStream('runQueryWithProvider error 1');
        out.putError({ errorType: 'provider_not_found', message: "Provider not found: " + providerId });
        out.done();
        return out;
    }

    const provider = graph.providers().one({ provider_id: providerId });

    if (!provider) {
        const out = graph.newStream('runQueryWithProvider error 2');
        out.putError({ errorType: 'provider_not_found', message: "Provider not found: " + providerId });
        out.done();
        return out;
    }

    return provider.runQuery(query, input);
}

export function findAndCallMountPoint(step: Step, tuple: QueryTuple, input: Stream, output: Stream) {

    const match = findBestPointMatch(step.graph, step.trace, tuple);

    if (!match) {

        if (BreakOnMatchFailure)
            throw new Error('no_table_found');

        const closestMatches = findClosestWrongMatches(step.graph, step.trace, tuple);

        const closestPoints = (closestMatches.bestMatches || []).map(({point}) => point.toDeclString());

        let error = {
            errorType: 'no_table_found',
            fromQuery: tuple,
        }

        if (closestPoints.length > 0) {
            (error as any).closest = closestPoints;
        }

        step.output.errorAndClose(error);
        return;
    }

    if (step.trace) {
        step.trace.event('findAndCallMountPoint $match', { match: wrapItem(match.match) });
    }

    callMountPoint(step, match, tuple, input, output);
}

function addAssumeIncludeTags(tuple: QueryTuple, point: MountPoint) {
    const assumeIncludeTags = [];

    for (const [ attr, attrConfig ] of Object.entries(point.attrs)) {
        if (attrConfig.assumeInclude && !tuple.has(attr)) {
            assumeIncludeTags.push(attr);
        }
    }

    if (assumeIncludeTags.length == 0)
        return tuple;


    tuple = tuple.shallowCopy();
    tuple.addAttrs(assumeIncludeTags);
    return tuple;
}

export function callMountPoint(step: Step, match: PointMatch, tuple: QueryTuple, input: Stream, output: Stream) {
    const point = match.point;

    tuple = addAssumeIncludeTags(tuple, point);

    const overprovidedTags: QueryTag[] = [];
    const defaultIncludeData = tuple.toDefaultIncludeValues();

    for (const [ attr, info ] of match.match.attrs.entries()) {
        if (info.t === 'attr_overprovided') {
            overprovidedTags.push(tuple.getAttr(attr));
        } else if (info.t === 'unused_optional') {
            // Don't attach a value from the query if it was an unused optional tag.
            delete defaultIncludeData[attr];
        }
    }

    if (step.trace) {
        step.trace.event('callMountPoint $tuple $overprovidedTags', {
            tuple, overprovidedTags: wrapItem(overprovidedTags)
        });
    }

    // Add a transformer to fix the outgoing output.
    let fixedOutput = new Stream(step.graph, 'fixed output for: ' + tuple.toQueryString());

    fixedOutput.transform(output, item => {

        if (step.trace) {
            step.trace.open('callMountPoint postTransform $item', { item: wrapItem(item) });
        }

        // Maybe drop an overprovided item according to tuple.
        for (const tag of overprovidedTags) {

            if (!has(item, tag.attr)) {
                continue;
            }

            let valueFromQuery = unwrapTagged(tag.value);

            if (valueFromQuery === undefined) {
                continue;
            }

            let valueFromItem = get(item, tag.attr);

            if ((valueFromQuery+'') !== ((valueFromItem)+'')) {
                if (VerboseFunctionOutputFiltering) {
                    console.slog(`callMountPoint post filter: result did not match specific value `
                                +`for '${tag.attr}' `
                                +`(query wants "${(valueFromQuery+'')}", `
                                +`output was "${((valueFromItem)+'')}")`);
                }
                return [];
            }
        }

        // Fix the outgoing item.
        //  - Include default values from the query (if missing from the item)
        //  - Drop attrs from the item if they were't requested by the query.
        //  - Return an object with the same key order as the query.
        const fixed = { };
        let anyKeysFromItem = false;

        for (const tag of tuple.tags) {
            if (tag.attr) {
                if (has(item, tag.attr)) {
                    fixed[tag.attr] = get(item, tag.attr);
                    anyKeysFromItem = true;
                    continue;
                }

                if (!tag.isOptional && has(defaultIncludeData, tag.attr)) {
                    fixed[tag.attr] = get(defaultIncludeData, tag.attr);
                    continue;
                }

                if (!tag.isOptional)
                    fixed[tag.attr] = null;
            }
        }

        /*
        console.log({ item, defaultIncludeData})

        for (const [ attr, value ] of Object.entries(defaultIncludeData)) {
            if (tuple.has(attr)) {
                fixed[attr] = value;
            }
        }

        for (const [ attr, value ] of Object.entries(item)) {
            if (tuple.has(attr)) {
                fixed[attr] = value;
                anyKeysFromItem = true;
            }
        }
        */

        if (!anyKeysFromItem) {
            // Drop this empty item.
            return [];
        }

        if (step.trace) {
            step.trace.close('callMountPoint postTransform $item');
        }

        return [fixed]
    });

    if (step.schemaOnly) {
        step.sawUsedMounts = step.sawUsedMounts || [];
        step.sawUsedMounts.push(point.getRef());
        fixedOutput.put(tuple.toItemValue());
        fixedOutput.done();
        return;
    }

    if (StreamValidation)
        fixedOutput = wrapStreamInValidator(`runNativeFunc (${tuple.toQueryString})`, fixedOutput);

    runNativeFunc(step.graph, step.context, point.getRef(), tuple, input, fixedOutput);
}
