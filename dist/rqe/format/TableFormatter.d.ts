import { Item } from '../Item';
import { Table } from '../Table';
export interface TableFormatState {
    schema?: Item;
    attrs: Map<string, {
        width: number;
        highestObservedWidth: number;
    }>;
    options?: CustomFormatOptions;
}
export interface CustomFormatOptions {
    transformItemsBeforeFormat?(item: Item): Item;
}
interface FormattedItem {
    lineCount: number;
    cells: Map<string, string[]>;
}
export declare function formatItems(state: TableFormatState, items: Iterable<Item>): FormattedItem[];
export declare function newTableFormatState(): TableFormatState;
export declare function updateStateForItems(state: TableFormatState, items: FormattedItem[]): void;
export declare function formatHeader(state: TableFormatState): {
    key: string;
    print(log: any): void;
};
export declare function printItems(state: TableFormatState, items: FormattedItem[], log: (s: string) => void): void;
export declare function formatTable(table: Table): string[];
export {};
