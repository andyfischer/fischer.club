import { MountPointSpec } from '../MountPoint';
import { Item } from '../Item';
import { Step } from '../Step';
import { Stream } from '../Stream';
export declare type ItemCallback = (item: Item, ctx?: Step) => null | void | Item | Item[] | Promise<Item | Item[]> | Stream;
export declare type HandlerCallback = (ctx: Step) => void | Promise<any>;
export declare function setupFunction(decl: string, callback: ItemCallback): MountPointSpec;
