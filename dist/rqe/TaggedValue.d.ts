import { Query, QueryAsObject } from './Query';
import { QueryTuple, QueryTupleAsObject } from './QueryTuple';
import { Item } from './Item';
import { MountPointSpec } from './MountPoint';
export interface StringValue {
    t: 'str_value';
    str: string;
}
export interface ObjectValue {
    t: 'obj_value';
    val: any;
}
export interface NoValue {
    t: 'no_value';
}
export interface ItemValue {
    t: 'item';
    item: Item;
}
export interface AbstractValue {
    t: 'abstract';
}
export declare type TaggedValue = StringValue | ItemValue | NoValue | AbstractValue | ObjectValue | QueryTuple | Query | MountPointSpec | QueryAsObject | QueryTupleAsObject;
export declare function toTagged(val: any): TaggedValue;
export declare function unwrapTagged(tval: TaggedValue): any;
export declare function wrapItem(item: Item): {
    t: string;
    item: any;
};
export declare function taggedToString(tval: TaggedValue): string;
export declare function taggedToObject(tval: TaggedValue): QueryAsObject | QueryTupleAsObject | MountPointSpec | StringValue | ItemValue | NoValue | AbstractValue | ObjectValue;
export declare function taggedFromObject(object: any): any;
export declare function tvalEquals(left: TaggedValue, right: TaggedValue): boolean;
export declare function toSerializable(val: any): any;
