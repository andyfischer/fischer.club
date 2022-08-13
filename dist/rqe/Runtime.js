"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callMountPoint = exports.findAndCallMountPoint = exports.runQueryWithProvider = exports.performQuery = exports.planAndPerformQuery = void 0;
const Plan_1 = require("./Plan");
const Stream_1 = require("./Stream");
const Item_1 = require("./Item");
const config_1 = require("./config");
const TaggedValue_1 = require("./TaggedValue");
const FindMatch_1 = require("./FindMatch");
const RunningQuery_1 = require("./RunningQuery");
const RunNativeFunc_1 = require("./RunNativeFunc");
const Debug_1 = require("./Debug");
const config_2 = require("./config");
function planAndPerformQuery(graph, query, parameters) {
    const planned = new Plan_1.QueryPlan(graph, query, {});
    const running = new RunningQuery_1.RunningQuery(graph, planned, parameters, {});
    return running.output;
}
exports.planAndPerformQuery = planAndPerformQuery;
function performQuery(plan, parameters, context) {
    const running = new RunningQuery_1.RunningQuery(plan.graph, plan, parameters, context);
    return running.output;
}
exports.performQuery = performQuery;
function runQueryWithProvider(graph, providerId, query, input) {
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
exports.runQueryWithProvider = runQueryWithProvider;
function findAndCallMountPoint(step, tuple, input, output) {
    const match = (0, FindMatch_1.findBestPointMatch)(step.graph, step.trace, tuple);
    if (!match) {
        if (config_1.BreakOnMatchFailure)
            throw new Error('no_table_found');
        const closestMatches = (0, FindMatch_1.findClosestWrongMatches)(step.graph, step.trace, tuple);
        const closestPoints = (closestMatches.bestMatches || []).map(({ point }) => point.toDeclString());
        let error = {
            errorType: 'no_table_found',
            fromQuery: tuple,
        };
        if (closestPoints.length > 0) {
            error.closest = closestPoints;
        }
        step.output.errorAndClose(error);
        return;
    }
    if (step.trace) {
        step.trace.event('findAndCallMountPoint $match', { match: (0, TaggedValue_1.wrapItem)(match.match) });
    }
    callMountPoint(step, match, tuple, input, output);
}
exports.findAndCallMountPoint = findAndCallMountPoint;
function addAssumeIncludeTags(tuple, point) {
    const assumeIncludeTags = [];
    for (const [attr, attrConfig] of Object.entries(point.attrs)) {
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
function callMountPoint(step, match, tuple, input, output) {
    const point = match.point;
    tuple = addAssumeIncludeTags(tuple, point);
    const overprovidedTags = [];
    const defaultIncludeData = tuple.toDefaultIncludeValues();
    for (const [attr, info] of match.match.attrs.entries()) {
        if (info.t === 'attr_overprovided') {
            overprovidedTags.push(tuple.getAttr(attr));
        }
        else if (info.t === 'unused_optional') {
            delete defaultIncludeData[attr];
        }
    }
    if (step.trace) {
        step.trace.event('callMountPoint $tuple $overprovidedTags', {
            tuple, overprovidedTags: (0, TaggedValue_1.wrapItem)(overprovidedTags)
        });
    }
    let fixedOutput = new Stream_1.Stream(step.graph, 'fixed output for: ' + tuple.toQueryString());
    fixedOutput.transform(output, item => {
        if (step.trace) {
            step.trace.open('callMountPoint postTransform $item', { item: (0, TaggedValue_1.wrapItem)(item) });
        }
        for (const tag of overprovidedTags) {
            if (!(0, Item_1.has)(item, tag.attr)) {
                continue;
            }
            let valueFromQuery = (0, TaggedValue_1.unwrapTagged)(tag.value);
            if (valueFromQuery === undefined) {
                continue;
            }
            let valueFromItem = (0, Item_1.get)(item, tag.attr);
            if ((valueFromQuery + '') !== ((valueFromItem) + '')) {
                if (config_1.VerboseFunctionOutputFiltering) {
                    console.slog(`callMountPoint post filter: result did not match specific value `
                        + `for '${tag.attr}' `
                        + `(query wants "${(valueFromQuery + '')}", `
                        + `output was "${((valueFromItem) + '')}")`);
                }
                return [];
            }
        }
        const fixed = {};
        let anyKeysFromItem = false;
        for (const tag of tuple.tags) {
            if (tag.attr) {
                if ((0, Item_1.has)(item, tag.attr)) {
                    fixed[tag.attr] = (0, Item_1.get)(item, tag.attr);
                    anyKeysFromItem = true;
                    continue;
                }
                if (!tag.isOptional && (0, Item_1.has)(defaultIncludeData, tag.attr)) {
                    fixed[tag.attr] = (0, Item_1.get)(defaultIncludeData, tag.attr);
                    continue;
                }
                if (!tag.isOptional)
                    fixed[tag.attr] = null;
            }
        }
        if (!anyKeysFromItem) {
            return [];
        }
        if (step.trace) {
            step.trace.close('callMountPoint postTransform $item');
        }
        return [fixed];
    });
    if (step.schemaOnly) {
        step.sawUsedMounts = step.sawUsedMounts || [];
        step.sawUsedMounts.push(point.getRef());
        fixedOutput.put(tuple.toItemValue());
        fixedOutput.done();
        return;
    }
    if (config_2.StreamValidation)
        fixedOutput = (0, Debug_1.wrapStreamInValidator)(`runNativeFunc (${tuple.toQueryString})`, fixedOutput);
    (0, RunNativeFunc_1.runNativeFunc)(step.graph, step.context, point.getRef(), tuple, input, fixedOutput);
}
exports.callMountPoint = callMountPoint;
//# sourceMappingURL=Runtime.js.map