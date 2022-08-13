"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapStreamInValidator = exports.StreamProtocolValidator = exports.assertDataIsSerializable = exports.structuredConsoleLog = exports.toStructuredString = exports.planToString = exports.valueToString = exports.mountPointToString = exports.tableSchemaToString = exports.graphTablesToString = exports.graphToString = void 0;
const TableFormatter_1 = require("./format/TableFormatter");
const TaggedValue_1 = require("./TaggedValue");
const config_1 = require("./config");
const QueryTuple_1 = require("./QueryTuple");
const Enums_1 = require("./Enums");
const Stream_1 = require("./Stream");
console.slog = structuredConsoleLog;
function graphToString(graph, options = {}) {
    const out = [];
    if (graph.graphId && !options.reproducible)
        out.push(`Graph ${graph.graphId || ''}:`);
    else
        out.push(`Graph:`);
    for (const module of graph.modules) {
        for (const point of module.points) {
            let str = '';
            if (point.name)
                str += `[${point.name}]`;
            str += '  ' + mountPointToString(point);
            out.push(str);
        }
    }
    return out.join('\n');
}
exports.graphToString = graphToString;
function graphTablesToString(graph, options = {}) {
    const out = [];
    if (graph.graphId && !options.reproducible)
        out.push(`Graph ${graph.graphId || ''} contents:`);
    else
        out.push(`Graph contents:`);
    for (const table of graph.tables.values()) {
        out.push(`  [${table.name}]`);
        for (const line of (0, TableFormatter_1.formatTable)(table)) {
            out.push('  ' + line);
        }
    }
    return out.join('\n');
}
exports.graphTablesToString = graphTablesToString;
function tableSchemaToString(table) {
    let out = [];
    if (table.name)
        out.push(`Table ${table.name}:`);
    else
        out.push(`Table:`);
    for (const index of table.indexes) {
        out.push(`  index: (${index.attrs.join(' ')})`);
    }
    return out.join('\n');
}
exports.tableSchemaToString = tableSchemaToString;
function mountPointToString(spec) {
    let requiredAttrs = [];
    let outputAttrs = [];
    for (const [attr, config] of Object.entries(spec.attrs)) {
        if (config.required)
            requiredAttrs.push(attr);
        else
            outputAttrs.push(attr);
    }
    let out = '';
    if (requiredAttrs.length > 0)
        out += `${requiredAttrs.join(' ')} `;
    if (outputAttrs.length > 0)
        out += `-> ${outputAttrs.join(' ')}`;
    return out;
}
exports.mountPointToString = mountPointToString;
function valueToString(value) {
    if (!value)
        return JSON.stringify(value);
    switch (value.t) {
        case 'query':
        case 'queryStep':
            return `(${value.toQueryString()})`;
            return `(${value.toQueryString()})`;
    }
    return JSON.stringify(value);
}
exports.valueToString = valueToString;
function planToString(plannedQuery) {
    let out = [];
    out.push("Planned query:");
    for (const step of plannedQuery.steps) {
        out.push(` [Step #${step.id}]`);
        out.push(`  tuple:   (${step.tuple.toQueryString()})`);
        out.push(`  expected result: ${JSON.stringify(step.expectedResult)}`);
    }
    return out.join('\n');
}
exports.planToString = planToString;
function toStructuredString(arg) {
    if (!arg)
        return arg + '';
    switch (arg.t) {
        case 'stream':
            return `Stream(id=${arg.id})`;
        case 'no_value':
            return '<no_value>';
        case 'some_value':
            return '<some_value>';
        case 'expected_value':
            return `expected_value(${arg.value.toQueryString()})`;
        case 'expected_union':
            return `expected_union([${arg.values.map(query => query.toQueryString()).join(', ')}])`;
        case 'tag':
            return (0, QueryTuple_1.queryTagToString)(arg);
    }
    if (Array.isArray(arg))
        return '[' + arg.map(toStructuredString).join(', ') + ']';
    if (arg.t)
        return (0, TaggedValue_1.taggedToString)(arg);
    if (arg == null)
        return arg + '';
    if (typeof arg === 'object') {
        const pairs = [];
        for (const [key, value] of Object.entries(arg)) {
            pairs.push(`${key}: ${toStructuredString(value)}`);
        }
        return `{${pairs.join(', ')}}`;
    }
    return arg + '';
}
exports.toStructuredString = toStructuredString;
function structuredConsoleLog(...args) {
    const out = args.map(toStructuredString);
    console.log.apply(null, out);
}
exports.structuredConsoleLog = structuredConsoleLog;
function assertDataIsSerializable(data) {
    if (config_1.EnableWarningOnUnserializableData) {
        if (typeof data === 'function') {
            const err = new Error("can't serialize type: function");
            err['badType'] = 'function';
            err['path'] = [];
            throw err;
        }
        if (typeof data === 'object') {
            for (const [k, v] of Object.entries(data)) {
                try {
                    assertDataIsSerializable(v);
                }
                catch (err) {
                    if (err['badType']) {
                        err['path'] = [k].concat(err['path']);
                        err.message = `can't serialize type: ${err['badType']} (at path: ${err['path'].join('.')})`;
                        throw err;
                    }
                }
            }
        }
    }
}
exports.assertDataIsSerializable = assertDataIsSerializable;
class StreamProtocolValidator {
    constructor(description) {
        this.hasSentDone = false;
        this.description = description;
    }
    check(msg) {
        if (this.hasSentDone) {
            const error = `Stream validation failed for (${this.description}), sent message after done: ${JSON.stringify(msg)}`;
            console.error(error);
            throw new Error(error);
        }
        if (msg.t === Enums_1.c_done) {
            this.hasSentDone = true;
        }
    }
}
exports.StreamProtocolValidator = StreamProtocolValidator;
function wrapStreamInValidator(description, after) {
    const before = new Stream_1.Stream();
    const validator = new StreamProtocolValidator(description);
    before.sendTo({
        receive(msg) {
            validator.check(msg);
            after.receive(msg);
        }
    });
    return before;
}
exports.wrapStreamInValidator = wrapStreamInValidator;
//# sourceMappingURL=Debug.js.map