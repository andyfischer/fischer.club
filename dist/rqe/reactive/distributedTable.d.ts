import { Table } from '../Table';
import { ItemChangeEvent } from './ItemChangeEvent';
import { Graph } from '../Graph';
interface Params {
    graph: Graph;
    source: Table;
    delayToSyncMs: number;
    onOutgoingData(changes: ItemChangeEvent[]): void;
}
export interface DistributedTableConnection {
    clientId: string;
    submitNow(): void;
    receiveIncomingData(changes: ItemChangeEvent[]): void;
}
export declare function applyChange(table: Table, change: ItemChangeEvent): void;
export declare function connectDistributedTable(params: Params): DistributedTableConnection;
export {};
