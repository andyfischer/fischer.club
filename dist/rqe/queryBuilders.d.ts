import { QueryLike, Query } from './Query';
import { QueryStepLike } from './QueryTuple';
export declare function add(...queries: QueryLike[]): Query;
export declare function where(looseLhs: QueryLike, looseWhereCondition: QueryStepLike): Query;
