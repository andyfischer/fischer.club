import { Query } from './Query';
export declare type DynamicValues = {
    [attr: string]: any;
};
export declare class StoredQuery {
    query: Query;
    constructor(query: Query);
    withValues(values: DynamicValues): Query;
}
