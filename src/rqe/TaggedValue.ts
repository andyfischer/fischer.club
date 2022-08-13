
import { Query, QueryAsObject } from './Query'
import { QueryTuple, QueryTupleAsObject, queryTupleToString } from './QueryTuple'
import { Item } from './Item'
import { formatItem } from './format/formatItem'
import { pointSpecToDeclString, MountPointSpec } from './MountPoint'
import { TaggedValueErrorOnUnknownTag } from './config'
import { assertDataIsSerializable } from './Debug'

export interface StringValue {
    t: 'str_value'
    str: string
}

export interface ObjectValue {
    t: 'obj_value'
    val: any
}

export interface NoValue {
    t: 'no_value'
}

export interface ItemValue {
    t: 'item'
    item: Item
}

export interface AbstractValue {
    t: 'abstract'
}

export type TaggedValue = StringValue | ItemValue | NoValue | AbstractValue | ObjectValue | QueryTuple | Query | MountPointSpec | QueryAsObject | QueryTupleAsObject

export function toTagged(val: any): TaggedValue {
    if (val == null) {
        return {
            t: 'no_value',
        }
    }

    switch (val.t) {
    case 'query':
    case 'queryTuple':
        return val;
    }

    switch (typeof val) {
    case 'string':
        return {
            t: 'str_value',
            str: val,
        }
    case 'number':
        return {
            t: 'str_value',
            str: val + '',
        }
    }

    return {
        t: 'obj_value',
        val,
    }

    throw new Error("unsupported type in toTagged: " + val);
}

export function unwrapTagged(tval: TaggedValue) {
    switch (tval.t) {
    case 'str_value':
        return tval.str;
    case 'no_value':
        return null;
    case 'query':
    case 'queryTuple':
        return tval;
    case 'item':
        return tval.item;
    case 'obj_value':
        return tval.val;
    case 'abstract':
        throw new Error(`can't unwrap an abstract value`);
    default:
        throw new Error('unhandled case in unwrapTagged: ' + (tval as any).t);
    }
}

export function wrapItem(item: Item) {
    return { t: 'item', item };
}

export function taggedToString(tval: TaggedValue) {
    switch (tval.t) {
    case 'str_value':
        return tval.str;
    case 'no_value':
        return '<no_value>';
    case 'query':
        return '(' + tval.toQueryString() + ')';
    case 'queryTuple': {
        return queryTupleToString(tval);
    }
    case 'item':
        return formatItem(tval.item);
    case 'obj_value':
        return JSON.stringify(tval.val);
    case 'mountPointSpec':
        return pointSpecToDeclString(tval);
    case 'abstract':
        return '<abstract>';
    default:
        if (TaggedValueErrorOnUnknownTag)
            throw new Error('unknown type in taggedToString: ' + (tval as any).t);

        return JSON.stringify(tval);
    }
}

export function taggedToObject(tval: TaggedValue) {
    switch (tval.t) {
    case 'query':
        return tval.toObject();
    case 'queryTuple':
        return tval.toObject();
    }

    return tval;
}

export function taggedFromObject(object: any) {
    switch (object.t) {
    case 'queryObject':
        return Query.fromObject(object);
    case 'queryTupleObject':
        return QueryTuple.fromObject(object);
    case 'query':
        throw new Error("can't fromObject a value with t=query");
    case 'queryTuple':
        throw new Error("can't fromObject a value with t=queryTuple");
    }

    return object;
}

export function tvalEquals(left: TaggedValue, right: TaggedValue) {
    if (left.t !== right.t)
        return false;

    switch (left.t) {
    case 'item':
    case 'queryTuple':
    case 'obj_value':
        console.warn('warning- tvalEquals not fully implemented for objects');
    }

    return unwrapTagged(left) === unwrapTagged(right);
}

export function toSerializable(val: any) {
    if (val?.t) {
        switch (val.t) {
        case 'query':
        case 'queryTuple':
            return val.toObject();
        }
    }

    assertDataIsSerializable(val);

    return val;
}
