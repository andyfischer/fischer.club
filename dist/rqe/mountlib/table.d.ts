import { Table } from '../Table';
import { MountPointSpec } from '../MountPoint';
export interface TableMountConfig {
    readonly?: boolean;
    namespace?: string[];
}
export declare function getTableMount(table: Table, opts?: TableMountConfig): MountPointSpec[];
