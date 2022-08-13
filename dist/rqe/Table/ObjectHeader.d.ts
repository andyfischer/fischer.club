import { Table } from '.';
import { OnDeleteOption } from '../Schema';
export interface ObjectHeader {
    table: Table;
    tableInternalKey: number;
    globalId?: string;
    referencers?: Map<string, RowReference>;
}
export interface RowReference {
    value: any;
    attr: string;
    onDelete: OnDeleteOption;
}
export declare function initRowInfo(object: any, rowinfo: ObjectHeader): void;
export declare function withoutHeader(object: any): any;
export declare function clearHeader(object: any): void;
export declare function header(object: any): ObjectHeader;
export declare function itemGlobalId(header: ObjectHeader): string;
