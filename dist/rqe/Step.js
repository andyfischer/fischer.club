"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Step = void 0;
const Runtime_1 = require("./Runtime");
const TaggedValue_1 = require("./TaggedValue");
class Step {
    constructor(args) {
        if (!args.context)
            throw new Error("missing .context");
        this.id = args.id;
        this.graph = args.graph;
        this.tuple = args.tuple;
        this.afterVerb = args.afterVerb;
        this.input = args.input;
        this.output = args.output;
        this.planned = args.planned;
        this.plannedStep = args.plannedStep;
        this.running = args.running;
        this.context = args.context;
        this.trace = args.trace;
    }
    has(attr) {
        return this.tuple.has(attr);
    }
    hasValue(attr) {
        return (this.tuple.getAttr(attr) !== undefined
            && this.tuple.getAttr(attr).value.t !== 'no_value');
    }
    getIncomingSchema() {
        return this.plannedStep.expectedInput;
    }
    query(queryLike, parameters = {}) {
        return this.graph.query(queryLike, parameters, this.context);
    }
    queryRelated(modifier) {
        return this.query(this.afterVerb.getRelated(modifier));
    }
    one(queryLike, parameters = {}) {
        return this.graph.one(queryLike, parameters);
    }
    attr(attr, queryLike, parameters = {}) {
        return this.graph.oneAttr(attr, queryLike, parameters);
    }
    oneAttr(attr, queryLike, parameters = {}) {
        return this.graph.oneAttr(attr, queryLike, parameters);
    }
    argsQuery() {
        return this.afterVerb;
    }
    args() {
        const out = {};
        const argsQuery = this.argsQuery();
        if (argsQuery) {
            for (const tag of this.argsQuery().tags) {
                out[tag.attr] = this.getOptional(tag.attr, null);
            }
        }
        return out;
    }
    get(attr) {
        const tag = this.tuple.getAttr(attr);
        if (!tag)
            throw new Error("No tag for: " + attr);
        const tval = tag && tag.value;
        if (!tval || tval.t === 'no_value')
            throw new Error("No value for: " + attr);
        return (0, TaggedValue_1.unwrapTagged)(tval);
    }
    getOptional(attr, defaultValue) {
        const tag = this.tuple.getAttr(attr);
        if (!tag)
            return defaultValue;
        const tval = tag && tag.value;
        if (!tval || tval.t === 'no_value')
            return defaultValue;
        return (0, TaggedValue_1.unwrapTagged)(tval);
    }
    getInt(attr) {
        return parseInt(this.get(attr), 10);
    }
    getOptionalInt(attr, defaultValue) {
        let value = this.getOptional(attr, defaultValue);
        return parseInt(value, 10);
    }
    getEnv(attr) {
        if (!this.context || !this.context.env)
            return null;
        const val = this.context.env[attr];
        if (val == null)
            return null;
        return val;
    }
    putHeader(obj) {
        this.output.putHeader(obj);
    }
    put(obj) {
        this.output.put(obj);
    }
    putError(obj) {
        this.output.putError(obj);
    }
    callPrepared(stored, values = {}) {
        return this.graph.callPrepared(stored, values);
    }
    done() {
        this.output.done();
    }
    async() {
        this.declaredAsync = true;
    }
    streaming() {
        this.declaredStreaming = true;
    }
    findAndCallMountPoint(tuple, input, output) {
        (0, Runtime_1.findAndCallMountPoint)(this, tuple, input, output);
    }
}
exports.Step = Step;
//# sourceMappingURL=Step.js.map