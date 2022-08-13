import { Table } from './Table/index';
import { TableSchema } from './Schema';
import { QueryTuple } from './QueryTuple';
import { QueryLike } from './Query';
import { Item } from './Item';
export declare type ErrorType = 'verb_not_found' | 'unhandled_exception' | 'provider_not_found' | 'missing_parameter' | 'no_table_found' | 'Unimplemented' | 'TableNotFound' | 'MissingAttrs' | 'MissingValue' | 'NotSupported' | 'ExtraAttrs' | 'http_protocol_error' | string;
export interface ErrorItem {
    errorType?: ErrorType;
    stack?: any;
    message?: string;
    data?: Item[];
    step?: number;
    verb?: string;
    fromQuery?: QueryLike;
    cause?: Error;
}
export declare class TableSchemaIssue extends Error {
    constructor(table: Table, message: string);
}
interface TableImplementationMetadata {
    filename?: string;
}
export declare class TableImplementationError extends Error {
    constructor(message: string, meta?: TableImplementationMetadata);
}
export declare const ErrorTableSchema: TableSchema;
export declare function errorItemToOneLineString(item: ErrorItem): string;
export declare function errorItemToString(item: ErrorItem): string;
export declare function newErrorTable(): Table<ErrorItem>;
export declare class ErrorExtended extends Error {
    errorItem: ErrorItem;
    constructor(errorItem: ErrorItem);
    toString(): string;
}
export declare function newError(item: ErrorItem): ErrorExtended;
export declare function newErrorFromItems(items: ErrorItem[]): ErrorExtended;
interface ErrorContext {
    fromQuery?: QueryTuple;
}
export declare function captureExceptionAsErrorItem(error: Error, context?: ErrorContext): ErrorItem;
export {};
