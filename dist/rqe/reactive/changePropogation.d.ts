import { Table } from '../Table';
import { TableSchema } from '../Schema';
import { ItemChangeEvent } from './ItemChangeEvent';
import { MountPoint } from '../MountPoint';
export declare function applyChange(change: ItemChangeEvent, table: Table, changeInfo?: any): void;
export declare function applyChangeToMountedTable(change: ItemChangeEvent, table: MountPoint, changeInfo?: any): void;
export declare function applyChangeList(changes: ItemChangeEvent[], table: Table): void;
export declare function findUniqueAttr(schema: TableSchema): string;
