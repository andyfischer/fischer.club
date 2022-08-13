import { Stream } from '../Stream';
import { Item } from '../Item';
interface ManagedStream {
    index: number;
    spec: string;
    steps: StreamStep[];
    stream: Stream;
}
interface StreamStep {
    timing: string;
    contents: string;
    stepIndex: number;
}
declare class StepIterator {
    stepIndex: number;
    stepCount: number;
    currentTiming: string;
    currentStreamIndex: number;
    streams: ManagedStream[];
    constructor(streams: ManagedStream[]);
    advance(): void;
    matchingStep(): {
        stream: ManagedStream;
        step: StreamStep;
    };
    stepCausesInterrupt(): boolean;
    done(): boolean;
}
export declare class ConcurrencySimulation {
    spec: string;
    streams: ManagedStream[];
    combined: Stream;
    constructor(spec: string);
    getExpectedResults(): Item[];
    doStep(it: StepIterator): void;
    run(): void;
    stream(i: number): Stream;
}
export {};
