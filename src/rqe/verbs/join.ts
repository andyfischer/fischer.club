
import { Step } from '../Step'
import { Stream } from '../Stream'
import { ErrorItem } from '../Errors'
import { findBestPointMatch, PointMatch } from '../FindMatch'
import { c_done, c_item } from '../Enums'
import { has, get, Item } from '../Item'
import { toTagged } from '../TaggedValue'
import { streamingAggregate } from '../Concurrency'
import { formatValue } from '../format/formatItem'
import { MultiMap } from '../utils/MultiMap'
import { BreakOnMatchFailure } from '../config'
import { wrapItem } from '../TaggedValue'

function run(step: Step) {

    const { graph, tuple } = step;

    const context = {};
    const incomingSchema = step.getIncomingSchema();
    const searchTuple = step.argsQuery();

    // First see if we can query RHS in side-by-side mode.
    const sideBySideMatch = findBestPointMatch(graph, step.trace, searchTuple);

    if (incomingSchema && sideBySideMatch) {
        // return runSideBySideMatch(step, sideBySideMatch);
    }

    if (step.trace)
        step.trace.open('join fanout');

    runFanout(step);

    if (step.trace)
        step.trace.close('join fanout');
}

function runSideBySideMatch(step: Step, match: PointMatch) {
    const rhsSearch = step.argsQuery();
    const rhsOutput = new Stream();
    step.findAndCallMountPoint(rhsSearch, Stream.newEmptyStream(), rhsOutput);

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

    function getItemKey(item: Item) {
        const strs = [];
        for (const attr of commonAttrs) {
            strs.push(formatValue(item[attr]));
        }
        return strs.join(',');
    }

    const found = [new MultiMap(), new MultiMap()];

    const overallOutput = step.output;

    streamingAggregate([step.input, rhsOutput], event => {
        if (event.t === 'done') {
            overallOutput.done();
            return;
        }

        if (event.msg.t === 'item') {
            const otherStream = event.streamIndex === 0 ? 1 : 0;

            const item = event.msg.item;
            const key = getItemKey(item);

            // Check for match
            for (const match of found[otherStream].get(key)) {
                const fixedItem = {
                    ...item
                }

                // Include any missing attributes from the other side.
                for (const [ key, value ] of Object.entries(match)) {
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

    /*
    const rhsResults = later.new_stream();
    prepareTableSearch(later, graph, withVerb(tuple, 'get'), later.new_empty_stream(), rhsResults);
    */
}

function staticCheckFanoutMatch(step: Step): { error?: ErrorItem, match?: any } {

    const { graph } = step;
    const searchTuple = step.argsQuery();
    const expectedInput = step.getIncomingSchema();

    if (expectedInput.t !== 'expected_value')
        // Can only do a static check for <expected_value>
        return {};

    // Statically try to find the match for doing fanout join.

    const fanoutSearch = searchTuple.remapTags(tag => {
        // Some "no value" tags will actually have a value, once we start doing the join.
        if (tag.identifier && tag.value.t === 'no_value') {
            return {
                ...tag,
                value: {
                    t: 'abstract'
                }
            }
        }

        if (tag.value.t === 'no_value') {
            if (expectedInput.value.has(tag.attr)) {
                return {
                    ...tag,
                    value: {
                        t: 'abstract'
                    }
                }
            }
        }

        return tag;
    });

    const fanoutMatch = findBestPointMatch(graph, step.trace, fanoutSearch);

    if (!fanoutMatch) {

        if (BreakOnMatchFailure)
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
        }
    }

    return {
        match: fanoutMatch
    }
}

function runFanout(step: Step) {

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
                lhsItem: wrapItem(lhsItem)
            });
        }

        const thisOutput = new Stream();
        const fixedOutput = new Stream();

        thisOutput.sendTo({
            receive(data) {
                switch (data.t) {
                    case c_done:
                        // console.log('join fixedOutput done');
                        fixedOutput.done();
                        break;
                    case c_item:

                        const fixedItem = {
                            ...searchTuple.toItemValue(),
                            ...data.item,
                        }

                        // Include any attributes in the lhsItem that weren't included in the
                        // rhs result.
                        for (const [ key, value ] of Object.entries(lhsItem)) {
                            if (fixedItem[key] === undefined)
                                fixedItem[key] = value;
                        }

                        if (step.trace) {
                            step.trace.event('join fanout $tuple $sent', {
                                tuple,
                                sent: wrapItem(fixedItem)
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
            // fixed (static) match

            if (step.trace) {
                step.trace.open('join fanout $tuple runTableSearch buildStaticSearch $searchTuple', {
                    tuple,
                    searchTuple,
                });
            }

            thisSearch = searchTuple.remapTags(tag => {
                // Inject values from the lhsItem

                if ((tag.value.t === 'no_value' || tag.value.t === 'abstract') && has(lhsItem, tag.attr)) {

                    let injectedValue = toTagged(get(lhsItem, tag.attr));

                    if (step.trace) {
                        step.trace.event('join fanout $tuple runTableSearch buildStaticSearch $attr $injectedValue', {
                            attr: tag.attr,
                            injectedValue,
                        });
                    }

                    return {
                        ...tag,
                        value: injectedValue,
                    }
                } else {
                    return tag;
                }
            });

            if (step.trace) {
                step.trace.close('join fanout $tuple runTableSearch buildStaticSearch $searchTuple');
            }

        } else {
            // dynamic match
            thisSearch = searchTuple.shallowCopy();
            for (const [ attr, value ] of Object.entries(lhsItem)) {
                thisSearch.addOrOverwriteTag({ t: 'tag', attr, isOptional: true, value: toTagged(value) });
            }
        }

        if (step.trace) {
            let matchType = staticCheck.match ? 'static' : 'dynamic'
            step.trace.event('join fanout $tuple runTableSearch $search $matchType', {
                tuple,
                search: thisSearch,
                matchType,
            });
        }

        // console.slog('join is running: ', thisSearch);

        step.findAndCallMountPoint(thisSearch, Stream.newEmptyStream(), thisOutput);

        return fixedOutput;
    }, { maxConcurrency: 300 });
}

export const join = {
    run,
}
