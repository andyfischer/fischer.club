import { Stream } from '../Stream';
import { IDSource } from '../utils/IDSource';
import { Item } from '../Item';
import { ErrorItem } from '../Errors';
import { TableFormatState } from './TableFormatter';
import { Queryable } from '../Graph';
import { Table } from '../Table';
interface Task {
    id: string;
    incoming: Stream;
    buffer: Item[];
    flushTimer: any;
    formatState: TableFormatState;
}
interface Settings {
    graph?: Queryable;
    log?: (...items: any[]) => void;
    printPrompt?: () => void;
    prompt?: string;
    setPrompt?: (s: string) => void;
}
declare type MostRecentOutput = 'none' | 'log' | 'prompt' | 'submitted' | {
    t: 'dataWithHeader';
    header: string;
};
export declare class ConsoleFormatter {
    graph: Queryable;
    nextTaskId: IDSource;
    activeTasks: Map<any, any>;
    flushDelayMs: number;
    log: (...items: any[]) => void;
    prompt: string;
    mostRecentOutput: MostRecentOutput;
    settings: Settings;
    header: Item;
    constructor(settings: Settings);
    newTask(): Task;
    logError(error: ErrorItem): void;
    printTable(table: Table): void;
    touch(): void;
    flushAllTasks(): void;
    flushTaskBuffer(id: string): void;
    preemptiveLog(...args: any[]): void;
    finishTask(id: string): void;
    printPrompt(): void;
    maybePrintPrompt(): void;
}
export {};
