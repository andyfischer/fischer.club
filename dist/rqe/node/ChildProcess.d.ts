/// <reference types="node" />
import * as child_process from 'child_process';
import { Table } from '../Table';
import { Graph } from '../Graph';
declare type ChildProcessOptions = Parameters<typeof child_process.spawn>[2];
interface ActiveProc {
    id?: string;
    proc: any;
    cmd: string;
    args: string[];
}
export declare const active_procs: Table<ActiveProc>;
export declare function spawn(graph: Graph, cmd: string, args: string[], options: ChildProcessOptions, moreOptions: {}): child_process.ChildProcess;
export declare const procs: Table<any>;
export {};
