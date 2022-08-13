"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencySimulation = void 0;
const Stream_1 = require("../Stream");
class StepIterator {
    constructor(streams) {
        this.stepIndex = 0;
        this.stepCount = 0;
        this.currentTiming = 'i';
        this.currentStreamIndex = 0;
        this.streams = streams;
        for (const stream of this.streams) {
            if (stream.steps.length > this.stepCount)
                this.stepCount = stream.steps.length;
        }
    }
    advance() {
        this.currentStreamIndex++;
        if (this.currentStreamIndex >= this.streams.length) {
            this.currentStreamIndex = 0;
            switch (this.currentTiming) {
                case 'i':
                    this.currentTiming = 'h';
                    break;
                case 'h':
                    this.currentTiming = 'o';
                    break;
                default:
                    this.currentTiming = 'i';
                    this.stepIndex++;
            }
        }
    }
    matchingStep() {
        const stream = this.streams[this.currentStreamIndex];
        const step = stream.steps[this.stepIndex];
        if (!step)
            return null;
        if (step.timing === this.currentTiming) {
            return { stream, step };
        }
        return null;
    }
    stepCausesInterrupt() {
        return this.currentTiming === 'h' || this.currentTiming === 'o';
    }
    done() {
        return this.stepIndex >= this.stepCount;
    }
}
class ConcurrencySimulation {
    constructor(spec) {
        this.streams = [];
        this.combined = new Stream_1.Stream();
        this.spec = spec;
        const streamStrs = spec.split(',');
        for (const streamStr of streamStrs) {
            let stepStrs = streamStr.split(' ').filter(item => !!item);
            const steps = [];
            for (const stepStr of stepStrs) {
                steps.push({
                    timing: stepStr[0],
                    contents: stepStr[1] || '1',
                    stepIndex: steps.length,
                });
            }
            this.streams.push({
                index: this.streams.length,
                spec,
                steps,
                stream: new Stream_1.Stream()
            });
        }
    }
    getExpectedResults() {
        const out = new Stream_1.Stream();
        for (const stream of this.streams)
            for (const step of stream.steps)
                switch (step.contents) {
                    case '1':
                        out.put({ data: step.stepIndex, stream: stream.index });
                }
        out.done();
        return out.sync().list();
    }
    doStep(it) {
        if (it.done()) {
            this.combined.done();
            return;
        }
        while (!it.done()) {
            const match = it.matchingStep();
            if (!match) {
                it.advance();
                continue;
            }
            switch (match.step.contents) {
                case 'd':
                    match.stream.stream.done();
                    break;
                case '1':
                    const item = { data: match.step.stepIndex, stream: match.stream.index };
                    match.stream.stream.put(item);
                    this.combined.put(item);
                    break;
            }
            if (it.stepCausesInterrupt()) {
                it.advance();
                setTimeout(() => this.doStep(it), 0);
                return;
            }
            else {
                it.advance();
                continue;
            }
        }
        this.combined.done();
    }
    run() {
        const it = new StepIterator(this.streams);
        this.doStep(it);
    }
    stream(i) {
        return this.streams[i].stream;
    }
}
exports.ConcurrencySimulation = ConcurrencySimulation;
function repeat(s, joiner, times) {
    let items = [];
    for (let i = 0; i < times; i++)
        items.push(s);
    return items.join(joiner);
}
function* scrambleSpecs(opts) {
    for (let i = 0; i < opts.numStreams; i++) {
    }
}
//# sourceMappingURL=ConcurrencySimulation.js.map