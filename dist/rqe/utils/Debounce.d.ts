export default class Debounce {
    callback: any;
    delayMs: number;
    pending: any;
    pendingArgs: any[];
    constructor(callback: (...args: any[]) => void, delayMs?: number);
    post(...args: any[]): void;
    fire(): void;
    cancel(): void;
}
