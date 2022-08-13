"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findClosestWrongMatches = exports.findBestPointMatch = exports.getClosestWrongQueryMountMatch = exports.getQueryMountMatch = void 0;
const QueryTuple_1 = require("./QueryTuple");
const TaggedValue_1 = require("./TaggedValue");
const config_1 = require("./config");
function findOneTagInPoint(trace, tag, point) {
    const attr = tag.attr;
    const queryHasKnownValue = tag.value.t !== 'no_value' && tag.value.t !== 'abstract';
    const queryWillHaveValue = queryHasKnownValue || (tag.value.t === 'abstract') || !!tag.identifier;
    const pointAttr = point.attrs[attr];
    if (!pointAttr) {
        if (config_1.VerboseTraceFindMatch) {
            console.slog(`  match failed, rule does not have ${attr}:`, point.spec);
        }
        return null;
    }
    if (pointAttr.requiresValue && !queryWillHaveValue) {
        if (config_1.VerboseTraceFindMatch) {
            console.slog(`  match failed, rule requires value for ${attr}:`, point.spec);
        }
        return null;
    }
    if (pointAttr.specificValue) {
        if (queryHasKnownValue) {
            if ((0, TaggedValue_1.tvalEquals)(pointAttr.specificValue, tag.value)) {
                return { t: 'exact' };
            }
            else {
                if (config_1.VerboseTraceFindMatch) {
                    console.slog(`  match failed, unequal known value for ${attr}:`, point.spec);
                }
                return null;
            }
        }
        if (queryWillHaveValue) {
            console.warn(`warning: can't yet support a match that is conditional on value (${attr})`);
            if (config_1.VerboseTraceFindMatch) {
                console.slog(`  match failed, dynamic value for ${attr}:`, point.spec);
            }
            return null;
        }
        return null;
    }
    if (queryWillHaveValue) {
        return { t: 'attr_overprovided' };
    }
    else {
        return { t: 'exact' };
    }
}
function getQueryMountMatch(trace, tuple, point) {
    const attrMatches = new Map();
    let unusedOptionalsCount = 0;
    for (const tag of tuple.tags) {
        if (tag.attr === undefined || tag.attr === 'undefined')
            throw new Error("attr = undefined?");
        if (!tag.attr)
            continue;
        let match = findOneTagInPoint(trace, tag, point);
        if (!match) {
            if (tag.isOptional) {
                match = { t: 'unused_optional' };
                unusedOptionalsCount++;
            }
            else {
                return null;
            }
        }
        attrMatches.set(tag.attr, match);
    }
    for (const [attr, config] of Object.entries(point.attrs)) {
        if (config.required && !attrMatches.has(attr)) {
            if (config_1.VerboseTraceFindMatch) {
                console.slog(`  match failed, rule requires ${attr}:`, tuple);
            }
            return null;
        }
    }
    if (config_1.VerboseTraceFindMatch) {
        console.slog(`  match success for:`, tuple);
    }
    return {
        attrs: attrMatches,
        unusedOptionalsCount,
    };
}
exports.getQueryMountMatch = getQueryMountMatch;
function getClosestWrongQueryMountMatch(trace, tuple, point) {
    const attrMatches = new Map();
    const matchProblems = [];
    let unusedOptionalsCount = 0;
    for (const tag of tuple.tags) {
        if (!tag.attr)
            continue;
        let match = findOneTagInPoint(trace, tag, point);
        if (!match) {
            if (tag.isOptional) {
                match = { t: 'unused_optional' };
                unusedOptionalsCount++;
            }
            else {
                matchProblems.push({
                    attr: tag.attr,
                    t: 'missing_from_point',
                    tag
                });
                continue;
            }
        }
        attrMatches.set(tag.attr, match);
    }
    for (const [attr, config] of Object.entries(point.attrs)) {
        if (config.required && !attrMatches.has(attr)) {
            matchProblems.push({
                t: 'missing_from_query',
                attr,
                config,
            });
        }
    }
    return {
        attrs: attrMatches,
        unusedOptionalsCount,
        matchProblems,
    };
}
exports.getClosestWrongQueryMountMatch = getClosestWrongQueryMountMatch;
function findBestPointMatch(graph, trace, tupleLike) {
    if (!graph)
        throw new Error("missing graph");
    const tuple = (0, QueryTuple_1.toQueryTuple)(tupleLike);
    if (config_1.VerboseTraceFindMatch)
        console.slog('FindMatch searching for: ', tuple);
    let matches = [];
    const points = graph.everyMountPoint();
    for (const point of points) {
        const match = getQueryMountMatch(trace, tuple, point);
        if (match)
            matches.push({ point, match });
    }
    if (matches.length === 0)
        return null;
    matches.sort((a, b) => a.match.unusedOptionalsCount - b.match.unusedOptionalsCount);
    if (matches.length > 1 && matches[0].match.unusedOptionalsCount === matches[1].match.unusedOptionalsCount) {
        if (config_1.WarnOnMultipleMatches)
            console.warn("ambiguous match warning: multiple found for: " + tuple.toQueryString());
    }
    const match = matches[0];
    return match;
}
exports.findBestPointMatch = findBestPointMatch;
function findClosestWrongMatches(graph, trace, tupleLike) {
    const tuple = (0, QueryTuple_1.toQueryTuple)(tupleLike);
    let bestScore = null;
    let bestMatches = null;
    const points = graph.everyMountPoint();
    for (const point of points) {
        const match = getClosestWrongQueryMountMatch(trace, tuple, point);
        const score = match.attrs.size;
        if (bestScore === null || score > bestScore) {
            bestScore = score;
            bestMatches = [{ point, match }];
        }
        else if (score == bestScore) {
            bestMatches.push({ point, match });
        }
    }
    return {
        bestMatches
    };
}
exports.findClosestWrongMatches = findClosestWrongMatches;
//# sourceMappingURL=FindMatch.js.map