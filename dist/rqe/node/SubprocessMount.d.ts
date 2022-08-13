import { Graph } from '../Graph';
import { Module } from '../Module';
import { MountPointSpec } from '../MountPoint';
import { IDSourceNumber as IDSource } from '../utils/IDSource';
import { Stream, StreamEvent } from '../Stream';
import { Query } from '../Query';
export interface ShellCommand {
    cmd: string;
    args: string[];
    options: {
        cwd?: string;
    };
}
export interface UpdateModule {
    t: 'updateModule';
    id: number;
    pointSpecs: MountPointSpec[];
}
export interface OutputData {
    t: 'output';
    streamId: number;
    msg: StreamEvent;
}
export declare type MessageFromSubprocess = UpdateModule | OutputData;
export interface QueryRequest {
    t: 'query';
    query: Query;
    input: number;
    output: number;
}
export declare type MessageToSubprocess = QueryRequest;
export declare class SubprocessMount {
    graph: Graph;
    command: ShellCommand;
    proc: any;
    streamIds: IDSource;
    modules: Map<number, Module>;
    outputStreams: Map<number, Stream>;
    subprocess_id: string;
    provider_id: string;
    constructor(graph: Graph, command: ShellCommand);
    start(): void;
    kill(): void;
    restart(): void;
    connectInputStream(input: Stream): any;
    connectOutputStream(): {
        outputStream: Stream;
        outputStreamId: number;
    };
    runQueryInSubprocess(query: Query, input: Stream): Stream;
    handle(msg: MessageFromSubprocess): void;
    closeEverything(): void;
}
export declare function toShellCommand(s: string): {
    cmd: string;
    args: string[];
    options: {};
};
export declare function setupSubprocessTable(graph: Graph): void;
