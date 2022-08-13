import { QueryExecutionContext } from './Graph';
import { MountPointRef } from './MountPoint';
import { Stream } from './Stream';
import { QueryTuple } from './QueryTuple';
import { Graph } from './Graph';
export declare function runNativeFunc(graph: Graph, context: QueryExecutionContext, pointRef: MountPointRef, tuple: QueryTuple, input: Stream, output: Stream): void;
