"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunningQuery = void 0;
const Stream_1 = require("./Stream");
const Step_1 = require("./Step");
const Errors_1 = require("./Errors");
class RunningQuery {
    constructor(graph, planned, parameters = {}, context) {
        this.output = graph.newStream('RunningQuery overall output');
        this.graph = graph;
        this.planned = planned;
        this.parameters = parameters;
        this.input = parameters && parameters['$input'] || null;
        this.context = context;
        this.trace = context.trace;
        if (this.trace)
            this.trace.open('runQuery');
        this.run();
        if (this.trace)
            this.trace.close('runQuery');
    }
    run() {
        if (this.graph && this.graph.logging.isEnabled()) {
        }
        const input = this.input || Stream_1.Stream.newEmptyStream();
        let previousOutput = input;
        const steps = [];
        for (const plannedStep of this.planned.steps) {
            const output = new Stream_1.Stream(this.graph, 'output of step: ' + plannedStep.id);
            let tuple = plannedStep.tuple.injectParameters(this.parameters);
            let afterVerb = plannedStep.afterVerb.injectParameters(this.parameters);
            const error = tuple.getErrorOnUnfilledParameters();
            if (error) {
                this.output.sendErrorItem(error);
                this.output.done();
                return;
            }
            const step = new Step_1.Step({
                id: plannedStep.id,
                graph: this.graph,
                tuple,
                afterVerb,
                input: previousOutput,
                output,
                planned: this.planned,
                plannedStep,
                running: this,
                context: this.context,
                trace: this.trace,
            });
            steps.push(step);
            previousOutput = output;
        }
        if (steps.length > 0) {
            steps[steps.length - 1].output.sendTo(this.output);
        }
        else {
            input.sendTo(this.output);
        }
        this.steps = steps;
        const expectedOutput = this.planned.getExpectedOutput();
        if (expectedOutput && expectedOutput.t === 'expected_value')
            this.output.receive({ t: 'schema', item: expectedOutput.value.toItemValue() });
        for (const step of steps)
            this.runOneStep(step);
    }
    runOneStep(step) {
        let verbDef = step.plannedStep.verbDef;
        let handler = verbDef.run;
        if (step.trace)
            step.trace.open('runOneStep $verb $tuple', { verb: verbDef.name, tuple: step.tuple });
        try {
            handler(step);
        }
        catch (e) {
            console.error('unhandled exception in runOneStep:', e);
            if (step.trace)
                step.trace.event('runOneStep unhandledException');
            if (!step.output.isDone()) {
                step.output.sendErrorItem((0, Errors_1.captureExceptionAsErrorItem)(e));
                step.output.close();
            }
        }
        if (step.trace)
            step.trace.close('runOneStep $verb $tuple', { verb: verbDef.name, tuple: step.tuple });
        return step;
    }
}
exports.RunningQuery = RunningQuery;
//# sourceMappingURL=RunningQuery.js.map