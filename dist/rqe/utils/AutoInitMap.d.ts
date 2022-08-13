export default class AutoInitMap<K, V> {
    init: (k: K) => V;
    map: Map<K, V>;
    constructor(init: (k: K) => V);
    get(k: K): V;
    getExisting(k: K): V;
    set(k: K, v: V): Map<K, V>;
    has(k: K): boolean;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[K, V]>;
}
