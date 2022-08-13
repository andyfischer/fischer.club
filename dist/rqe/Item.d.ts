/// <reference types="node" />
export declare type AttrValue = boolean | number | string | null | Buffer | any;
export declare type Item = any | {
    [attr: string]: AttrValue;
};
export declare function has(item: Item, attr: string): boolean;
export declare function get(item: Item, attr: string): any;
export declare function set(item: Item, attr: string, value: any): void;
export declare function attrs(item: Item): string[];
export declare function entries(item: Item): [string, unknown][];
export declare function shallowCopy(item: Item): any;
export declare function newItem(): Item;
export declare function isItem(value: any): boolean;
