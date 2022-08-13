import { Table } from '.';
export declare type TableLike<T> = Array<T> | Table<T>;
export declare function toTable<T>(tableLike: TableLike<T>): Table<T>;
