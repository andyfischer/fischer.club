import { Queryable } from '../Graph';
export interface ReplOptions {
    prompt?: string;
}
export declare function startConsoleRepl(graph: Queryable, opts?: ReplOptions): any;
