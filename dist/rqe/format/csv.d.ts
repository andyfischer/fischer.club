import { Table } from '../Table';
interface Options {
    attrs?: string[];
    includeHeader?: boolean;
}
export declare function formatAsCsv(table: Table, opts?: Options): IterableIterator<string>;
export {};
