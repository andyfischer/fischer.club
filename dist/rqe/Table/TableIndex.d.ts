import { AttrSet, AttrMap, LooseAttrList } from '.';
import { Table } from '.';
import { Item } from '../Item';
export default class TableIndex<ValueType> {
    table: Table;
    attrSet: AttrSet;
    attrs: string[];
    data: Map<string, Map<any, any>>;
    constructor(table: Table, attrs: LooseAttrList);
    toKey(attrs: Map<string, any>): string;
    toKeyUsingItem(item: ValueType): string;
    get(attrs: AttrMap): Generator<any, void, undefined>;
    getOne(attrs: AttrMap): any;
    insert(item: ValueType): void;
    remove(item: ValueType): void;
    coversItem(item: Item): boolean;
    matchesAttrList(attrs: string[]): boolean;
    coversSingleAttribute(attr: string): boolean;
    rebuild(): void;
}
