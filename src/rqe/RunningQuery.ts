
import { QueryPlan } from './Plan'
import { Stream } from './Stream'
import { Step } from './Step'
import { Graph } from './Graph'
import { QueryParameters } from './Query'
import { QueryExecutionContext } from './Graph'
import { Trace } from './Trace'
import { captureExceptionAsErrorItem } from './Errors'

export class RunningQuery {
    graph: Graph
    planned: QueryPlan
    context: QueryExecutionContext
    input: Stream
    parameters: any
    steps: Step[]
    trace: Trace
    output: Stream

    constructor(graph: Graph, planned: QueryPlan, parameters: QueryParameters = {}, context: QueryExecutionContext) {
        this.output = graph.newStream('RunningQuery overall output')
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

    private run() {
        if (this.graph && this.graph.logging.isEnabled()) {
            // this.graph.logging.put('planning', `executing planned query:\n${this.planned.toLinked().str({ omitHeader: true })}`);
        }

        const input = this.input || Stream.newEmptyStream();

        let previousOutput = input;

        const steps: Step[] = [];
        
        for (const plannedStep of this.planned.steps) {
            const output = new Stream(this.graph, 'output of step: ' + plannedStep.id);

            let tuple = plannedStep.tuple.injectParameters(this.parameters);
            let afterVerb = plannedStep.afterVerb.injectParameters(this.parameters);

            // Validate parameters are provided
            const error = tuple.getErrorOnUnfilledParameters();
            if (error) {
                this.output.sendErrorItem(error);
                this.output.done();
                return;
            }

            const step = new Step({
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
            // Connect last output to RunningQuery.output.
            steps[steps.length - 1].output.sendTo(this.output);
        } else {
            // No steps - just pass through input -> output.
            input.sendTo(this.output);
        }

        this.steps = steps;

        // Output the schema.
        const expectedOutput = this.planned.getExpectedOutput();
        if (expectedOutput && expectedOutput.t === 'expected_value')
            this.output.receive({ t: 'schema', item: expectedOutput.value.toItemValue() });

        // Start the actual execution steps.
        for (const step of steps)
            this.runOneStep(step);
    }

    private runOneStep(step: Step) {
        let verbDef = step.plannedStep.verbDef;
        let handler = verbDef.run;

        if (step.trace)
            step.trace.open('runOneStep $verb $tuple', { verb: verbDef.name, tuple: step.tuple });

        try {
            handler(step);
        } catch (e) {
            console.error('unhandled exception in runOneStep:', e);
            if (step.trace)
                step.trace.event('runOneStep unhandledException');

            if (!step.output.isDone()) {
                step.output.sendErrorItem(captureExceptionAsErrorItem(e));
                step.output.close();
            }
        }

        if (step.trace)
            step.trace.close('runOneStep $verb $tuple', { verb: verbDef.name, tuple: step.tuple });

        return step;
    }
}
