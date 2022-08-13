import { Table } from './Table';
import { Graph } from './Graph';
import { Query } from './Query';
import { QueryTuple } from './QueryTuple';
import { ErrorItem } from './Errors';
import { IDSourceNumber as IDSource } from './utils/IDSource';
import { QueryExecutionContext } from './Graph';
import { PointMatch } from './FindMatch';
import { Verb } from './verbs/_shared';
import { MountPointRef } from './MountPoint';
import { Trace } from './Trace';
export interface PlannedStep {
    id: number;
    plannedQuery: QueryPlan;
    tuple: QueryTuple;
    afterVerb: QueryTuple;
    verbDef: Verb;
    staticMatch?: {
        t: 'found';
        match: PointMatch;
    } | {
        t: 'not_found';
    };
    expectedInput: ExpectedValue;
    expectedResult: ExpectedExecution;
}
export interface NoInputExpected {
    t: 'no_value';
}
export interface SomeInputExpected {
    t: 'some_value';
}
export interface ExpectedSingleValue {
    t: 'expected_value';
    value: QueryTuple;
}
export interface ExpectedUnionValue {
    t: 'expected_union';
    values: QueryTuple[];
}
export declare type ExpectedValue = NoInputExpected | SomeInputExpected | ExpectedSingleValue | ExpectedUnionValue;
interface ExpectedExecution {
    errors: ErrorItem[];
    output: ExpectedValue;
    usesMounts: MountPointRef[];
}
export declare class QueryPlan {
    graph: Graph;
    query: Query;
    steps: PlannedStep[];
    stepIds: IDSource;
    trace?: Trace;
    constructor(graph: Graph, query: Query, context?: QueryExecutionContext);
    private prepare;
    getExpectedOutput(): ExpectedValue;
    getPrepareErrors(): Table;
    str(): string;
}
export declare function findVerbForTuple(graph: Graph, tuple: QueryTuple, expectedInput: ExpectedValue): {
    verbDef: Verb;
    afterVerb: QueryTuple;
};
export declare function createOnePlannedStep(plannedQuery: QueryPlan, tuple: QueryTuple, expectedInput: ExpectedValue): PlannedStep;
export declare function createInitialPlannedSteps(plannedQuery: QueryPlan): void;
export declare function abstractRunStep(plannedQuery: QueryPlan, plannedStep: PlannedStep): ExpectedExecution;
export {};
