import { Graph } from '../Graph';
import { ConsoleFormatter } from '../format/ConsoleFormatter';
export interface ReplOptions {
    prompt?: string;
}
export default class GraphRepl {
    graph: Graph;
    opts: ReplOptions;
    formatter: ConsoleFormatter;
    constructor(graph: Graph, opts: ReplOptions);
    eval(line: string, onDone: any): Promise<void>;
}
