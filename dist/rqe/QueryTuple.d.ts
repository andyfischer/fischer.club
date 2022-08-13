import { TaggedValue } from './TaggedValue';
import { Item } from './Item';
import { QueryParameters, QueryModifier } from './Query';
import { Graph } from './Graph';
import { ErrorItem } from './Errors';
export declare type QueryStepLike = QueryTuple | LooseQueryVerbStep | Function | string;
export interface QueryTag {
    t: 'tag';
    attr: string;
    value: TaggedValue;
    identifier?: string;
    specialAttr?: {
        t: 'star';
    };
    isOptional?: true;
    isFlag?: true;
}
export interface QueryTupleAsObject {
    t: 'queryTupleObject';
    tags: QueryTag[];
}
interface QueryPrepareContext {
    graph?: Graph;
    expectTransform?: boolean;
}
export interface LooseQueryVerbStep {
    attrs: {
        [key: string]: any;
    };
}
export declare class QueryTuple {
    t: 'queryTuple';
    tags: QueryTag[];
    byAttr: Map<string, number>;
    constructor(tags: QueryTag[]);
    rebuildByAttr(): void;
    getAttr(attr: string): QueryTag;
    getStringValue(attr: string): string;
    has(attr: string): boolean;
    hasValue(attr: string): boolean;
    hasStar(): boolean;
    shallowCopy(): QueryTuple;
    withoutStar(): QueryTuple;
    withoutFirstTag(): QueryTuple;
    addTag(tag: QueryTag): void;
    addAttr(attr: string): void;
    addAttrIfNeeded(attr: string): void;
    addAttrs(attrs: string[]): void;
    addAttrsIfNeeded(attrs: string[]): void;
    remapTags(callback: (tag: QueryTag) => QueryTag): QueryTuple;
    overwriteTag(tag: QueryTag): void;
    addOrOverwriteTag(tag: QueryTag): void;
    deleteAttr(attr: string): void;
    toItemValue(): any;
    toDefaultIncludeValues(): any;
    injectParameters(parameters: QueryParameters): QueryTuple;
    getRelated(modifier: QueryModifier): QueryTuple;
    getErrorOnUnfilledParameters(): ErrorItem | null;
    errorOnUnfilledParameters(): void;
    checkFilledParameters(params: QueryParameters): void;
    convertToPut(): QueryTuple;
    static fromItem(item: Item): QueryTuple;
    toObject(): QueryTupleAsObject;
    equals(rhs: QueryTuple): boolean;
    static fromObject(object: QueryTupleAsObject): QueryTuple;
    toQueryString(): string;
}
export declare function queryTupleToString(tuple: QueryTuple): string;
export declare function queryTagToString(tag: QueryTag): string;
export declare function toQueryTuple(step: QueryStepLike, ctx?: QueryPrepareContext): QueryTuple;
export {};
