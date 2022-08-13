import { Item } from '../Item';
export interface ItemChangeEvent {
    verb: 'put' | 'delete' | 'update';
    writer?: string;
    item: Item;
}
export declare type ItemChangeListener = (evt: ItemChangeEvent) => void;
