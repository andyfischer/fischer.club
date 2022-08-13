import { Step } from './Step';
import { QueryLike } from './Query';
import { StoredQuery } from './StoredQuery';
import { Item } from './Item';
import { MountPointSpec, MountAttr } from './MountPoint';
import { Stream } from './Stream';
export declare type ItemCallback = (item: Item, ctx?: Step) => null | void | Item | Item[] | Promise<Item | Item[]> | Stream;
export declare type HandlerCallback = (ctx: Step) => void | Promise<any>;
export interface LooseBindParams {
    attrs?: string | string[] | {
        [attr: string]: MountAttr;
    };
    name?: string;
    run?: HandlerCallback;
}
export declare function toMountSpec(looseSpec: LooseBindParams): MountPointSpec;
export declare class Setup {
    attrs: {
        [attr: string]: MountAttr;
    };
    _tableName: string;
    aliasQuery: QueryLike;
    runCallback: HandlerCallback;
    parent: Setup;
    children: Setup[];
    bind(looseSpec: LooseBindParams): Setup;
    table(params: LooseBindParams): Setup;
    mount(decl: string, callback: HandlerCallback): void;
    tableName(name: string): this;
    get(callback: HandlerCallback): this;
    run(callback: HandlerCallback): this;
    put(callback: HandlerCallback): Setup;
    getAttrsWithInherited(): {
        [attr: string]: MountAttr;
    };
    iterateChildren(): IterableIterator<Setup>;
    toSpecs(): MountPointSpec[];
    prepareQuery(queryLike: QueryLike): StoredQuery;
    alias(aliasQuery: QueryLike): void;
}
export declare function toTableBind(decl: string, callback: HandlerCallback): MountPointSpec;
