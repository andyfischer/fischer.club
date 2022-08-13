import { Graph } from './Graph';
import { MountPointSpec } from './MountPoint';
import { Table } from './Table';
import { QueryPlan } from './Plan';
import { Stream, StreamEvent } from './Stream';
declare global {
    interface Console {
        slog: typeof console.log;
    }
}
export declare function graphToString(graph: Graph, options?: {
    reproducible?: boolean;
}): string;
export declare function graphTablesToString(graph: Graph, options?: {
    reproducible?: boolean;
}): string;
export declare function tableSchemaToString(table: Table): string;
export declare function mountPointToString(spec: MountPointSpec): string;
export declare function valueToString(value: any): string;
export declare function planToString(plannedQuery: QueryPlan): string;
export declare function toStructuredString(arg: any): String;
export declare function structuredConsoleLog(...args: any[]): void;
export declare function assertDataIsSerializable(data: any): void;
export declare class StreamProtocolValidator {
    description: string;
    hasSentDone: boolean;
    constructor(description: string);
    check(msg: StreamEvent): void;
}
export declare function wrapStreamInValidator(description: string, after: Stream): Stream;
