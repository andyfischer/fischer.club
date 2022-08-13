import { Graph } from '../Graph';
import { ReplOptions } from './consoleRepl';
import { ShellCommand } from './SubprocessMount';
import { QueryLike } from '../Query';
import '../tools/common/InterceptConsoleLog';
interface StartOptions {
    setupGraph?(graph: Graph): void;
    onReady?(graph: Graph): void | Promise<void>;
    runWhenReady?: QueryLike[];
    loadFiles?: string[];
    loadModules?: any[];
    loadFromCurrentDirectory?: boolean;
    loadUserSetupDirectory?: boolean;
    loadSubprocesses?: ShellCommand[];
    startRepl?: boolean | ReplOptions;
    terminal?: {
        title?: string;
    };
    runFromStdin?: boolean;
    standardCommandLineArgHandling?: boolean;
    enableLoggingCategories?: string[];
}
export declare function setupCliGraph(options: StartOptions): Graph;
export declare function runCommandLineProcess(options?: StartOptions): Promise<Graph>;
export {};
