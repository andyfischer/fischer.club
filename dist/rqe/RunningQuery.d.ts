import { QueryPlan } from './Plan';
import { Stream } from './Stream';
import { Step } from './Step';
import { Graph } from './Graph';
import { QueryParameters } from './Query';
import { QueryExecutionContext } from './Graph';
import { Trace } from './Trace';
export declare class RunningQuery {
    graph: Graph;
    planned: QueryPlan;
    context: QueryExecutionContext;
    input: Stream;
    parameters: any;
    steps: Step[];
    trace: Trace;
    output: Stream;
    constructor(graph: Graph, planned: QueryPlan, parameters: QueryParameters, context: QueryExecutionContext);
    private run;
    private runOneStep;
}
