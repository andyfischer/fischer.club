"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.join = void 0;
const Stream_1 = require("../Stream");
const FindMatch_1 = require("../FindMatch");
const Enums_1 = require("../Enums");
const Item_1 = require("../Item");
const TaggedValue_1 = require("../TaggedValue");
const Concurrency_1 = require("../Concurrency");
const formatItem_1 = require("../format/formatItem");
const MultiMap_1 = require("../utils/MultiMap");
const config_1 = require("../config");
const TaggedValue_2 = require("../TaggedValue");
function run(step) {
    const { graph, tuple } = step;
    const context = {};
    const incomingSchema = step.getIncomingSchema();
    const searchTuple = step.argsQuery();
    const sideBySideMatch = (0, FindMatch_1.findBestPointMatch)(graph, step.trace, searchTuple);
    if (incomingSchema && sideBySideMatch) {
    }
    if (step.trace)
        step.trace.open('join fanout');
    runFanout(step);
    if (step.trace)
        step.trace.close('join fanout');
}
function runSideBySideMatch(step, match) {
    const rhsSearch = step.argsQuery();
    const rhsOutput = new Stream_1.Stream();
    step.findAndCallMountPoint(rhsSearch, Stream_1.Stream.newEmptyStream(), rhsOutput);
    const lhsSchema = step.incomingSchema;
    const commonAttrs = [];
    for (const attr of Object.keys(lhsSchema[0])) {
        if (match.match.attrs.has(attr)) {
            commonAttrs.push(attr);
        }
    }
    if (commonAttrs.length === 0) {
        throw new Error("Can't side-by-side match, no common attrs");
    }
    function getItemKey(item) {
        const strs = [];
        for (const attr of commonAttrs) {
            strs.push((0, formatItem_1.formatValue)(item[attr]));
        }
        return strs.join(',');
    }
    const found = [new MultiMap_1.MultiMap(), new MultiMap_1.MultiMap()];
    const overallOutput = step.output;
    (0, Concurrency_1.streamingAggregate)([step.input, rhsOutput], event => {
        if (event.t === 'done') {
            overallOutput.done();
            return;
        }
        if (event.msg.t === 'item') {
            const otherStream = event.streamIndex === 0 ? 1 : 0;
            const item = event.msg.item;
            const key = getItemKey(item);
            for (const match of found[otherStream].get(key)) {
                const fixedItem = {
                    ...item
                };
                for (const [key, value] of Object.entries(match)) {
                    if (fixedItem[key] === undefined)
                        fixedItem[key] = value;
                }
                overallOutput.put(fixedItem);
            }
            found[event.streamIndex].add(key, item);
            return;
        }
        if (event.msg.t === 'done')
            return;
        overallOutput.receive(event.msg);
    });
}
function staticCheckFanoutMatch(step) {
    const { graph } = step;
    const searchTuple = step.argsQuery();
    const expectedInput = step.getIncomingSchema();
    if (expectedInput.t !== 'expected_value')
        return {};
    const fanoutSearch = searchTuple.remapTags(tag => {
        if (tag.identifier && tag.value.t === 'no_value') {
            return {
                ...tag,
                value: {
                    t: 'abstract'
                }
            };
        }
        if (tag.value.t === 'no_value') {
            if (expectedInput.value.has(tag.attr)) {
                return {
                    ...tag,
                    value: {
                        t: 'abstract'
                    }
                };
            }
        }
        return tag;
    });
    const fanoutMatch = (0, FindMatch_1.findBestPointMatch)(graph, step.trace, fanoutSearch);
    if (!fanoutMatch) {
        if (config_1.BreakOnMatchFailure)
            throw new Error('no_table_found');
        return {
            error: {
                errorType: 'no_table_found',
                fromQuery: fanoutSearch,
                data: [{
                        joinPhase: 'static',
                        joinExpectedInput: expectedInput,
                    }]
            }
        };
    }
    return {
        match: fanoutMatch
    };
}
function runFanout(step) {
    const { input, output, tuple, graph } = step;
    const searchTuple = step.argsQuery();
    const expectedInput = step.getIncomingSchema();
    const staticCheck = staticCheckFanoutMatch(step);
    if (staticCheck.error) {
        step.output.errorAndClose(staticCheck.error);
        return;
    }
    input.streamingTransform(step.output, lhsItem => {
        if (step.trace) {
            step.trace.event('join fanout $tuple received $lhsItem', {
                tuple,
                lhsItem: (0, TaggedValue_2.wrapItem)(lhsItem)
            });
        }
        const thisOutput = new Stream_1.Stream();
        const fixedOutput = new Stream_1.Stream();
        thisOutput.sendTo({
            receive(data) {
                switch (data.t) {
                    case Enums_1.c_done:
                        fixedOutput.done();
                        break;
                    case Enums_1.c_item:
                        const fixedItem = {
                            ...searchTuple.toItemValue(),
                            ...data.item,
                        };
                        for (const [key, value] of Object.entries(lhsItem)) {
                            if (fixedItem[key] === undefined)
                                fixedItem[key] = value;
                        }
                        if (step.trace) {
                            step.trace.event('join fanout $tuple $sent', {
                                tuple,
                                sent: (0, TaggedValue_2.wrapItem)(fixedItem)
                            });
                        }
                        fixedOutput.put(fixedItem);
                        break;
                    default:
                        fixedOutput.receive(data);
                        break;
                }
            }
        });
        let thisSearch;
        if (staticCheck.match) {
            if (step.trace) {
                step.trace.open('join fanout $tuple runTableSearch buildStaticSearch $searchTuple', {
                    tuple,
                    searchTuple,
                });
            }
            thisSearch = searchTuple.remapTags(tag => {
                if ((tag.value.t === 'no_value' || tag.value.t === 'abstract') && (0, Item_1.has)(lhsItem, tag.attr)) {
                    let injectedValue = (0, TaggedValue_1.toTagged)((0, Item_1.get)(lhsItem, tag.attr));
                    if (step.trace) {
                        step.trace.event('join fanout $tuple runTableSearch buildStaticSearch $attr $injectedValue', {
                            attr: tag.attr,
                            injectedValue,
                        });
                    }
                    return {
                        ...tag,
                        value: injectedValue,
                    };
                }
                else {
                    return tag;
                }
            });
            if (step.trace) {
                step.trace.close('join fanout $tuple runTableSearch buildStaticSearch $searchTuple');
            }
        }
        else {
            thisSearch = searchTuple.shallowCopy();
            for (const [attr, value] of Object.entries(lhsItem)) {
                thisSearch.addOrOverwriteTag({ t: 'tag', attr, isOptional: true, value: (0, TaggedValue_1.toTagged)(value) });
            }
        }
        if (step.trace) {
            let matchType = staticCheck.match ? 'static' : 'dynamic';
            step.trace.event('join fanout $tuple runTableSearch $search $matchType', {
                tuple,
                search: thisSearch,
                matchType,
            });
        }
        step.findAndCallMountPoint(thisSearch, Stream_1.Stream.newEmptyStream(), thisOutput);
        return fixedOutput;
    }, { maxConcurrency: 300 });
}
exports.join = {
    run,
};
//# sourceMappingURL=join.js.map