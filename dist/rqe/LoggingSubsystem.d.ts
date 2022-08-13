import { Graph } from './Graph';
import { Table } from './Table';
export declare type LogCategory = 'planning' | 'execution' | 'subprocess';
export declare class EmptyLoggingSubsystem {
    isEnabled(): boolean;
    put(category: LogCategory, text: string): void;
    enable(category: string): void;
}
interface LogCategoryEnabled {
    category: string;
    enabled: boolean;
}
export declare class ConsoleLoggingSubsystem {
    categoryEnabled: Table<LogCategoryEnabled>;
    isEnabled(): boolean;
    constructor(graph: Graph);
    enable(category: string): void;
    put(category: LogCategory, text: string): void;
}
export declare function setupLoggingSubsystem(graph: Graph): void;
export {};
