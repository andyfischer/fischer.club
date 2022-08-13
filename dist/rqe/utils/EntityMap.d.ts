export default class EntitySet<V> {
    idPrefix: string;
    nextId: number;
    map: Map<string, V>;
    constructor({ idPrefix }?: {
        idPrefix?: string;
    });
    get(id: string): V;
    has(id: string): boolean;
    add(item: V): string;
    delete(id: string): void;
    entries(): IterableIterator<[string, V]>;
    items(): IterableIterator<V>;
}
