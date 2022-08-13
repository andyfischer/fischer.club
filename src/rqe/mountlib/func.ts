
import { MountPointSpec } from '../MountPoint'
import { Item } from '../Item'
import { Step } from '../Step'
import { Stream } from '../Stream'
import { parseTableDecl } from '../parser/parseTableDecl'

export type ItemCallback = (item: Item, ctx?: Step) => null | void | Item | Item[] | Promise<Item | Item[]> | Stream
export type HandlerCallback = (ctx: Step) => void | Promise<any>

function itemCallbackToHandler(callback: ItemCallback): HandlerCallback {
    return (step: Step) => {
        const input = step.args();
        const data: any = callback(input, step);
        return data;
    }
}

export function setupFunction(decl: string, callback: ItemCallback): MountPointSpec {
    const mount = parseTableDecl(decl);
    mount.run = itemCallbackToHandler(callback);

    return mount;
}
