import { Failure } from './FailureTracking';
import { Table } from './Table';
interface TestCase {
}
declare type Name = 'failures' | 'test_case' | 'alt_impl' | 'func_cache' | 'listener_close_signal' | 'resource_tag_to_close_signal';
export declare class BuiltinTables {
    map: Map<Name, Table<any>>;
    get(name: Name): Table<any>;
    has(name: Name): boolean;
    failures(): Table<Failure>;
    testCases(): Table<TestCase>;
    altImpl(): Table<{
        name: string;
        enabled: boolean;
    }>;
    funcCache(): Table<any>;
    listener_close_signal(): Table<any>;
    resource_tag_to_close_signal(): Table<any>;
}
export {};
