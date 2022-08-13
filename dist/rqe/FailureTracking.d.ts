import { Graph } from './Graph';
import { ErrorItem } from './Errors';
export interface Failure {
    failure_id: string;
    message: string;
    stack: any;
    check_attrs: any;
}
export declare function shouldCheck(): boolean;
export interface FailureAttrs {
    graph?: Graph;
    [key: string]: any;
}
export declare function recordFailure(message: string, attrs?: FailureAttrs): string;
export declare function recordUnhandledError(error: ErrorItem, graph?: Graph): string;
export declare function recordUnhandledException(e: Error, graph?: Graph): void;
