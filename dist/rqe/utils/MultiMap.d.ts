export declare class MultiMap<K, V> {
    items: Map<K, V[]>;
    add(key: K, item: V): void;
    has(key: K): boolean;
    get(key: K): Array<V>;
    keys(): IterableIterator<K>;
    entries(): IterableIterator<[K, V[]]>;
    size(): number;
}
