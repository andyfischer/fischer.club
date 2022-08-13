export declare class ConcurrencyPool {
    nextId: number;
    active: Set<number>;
    activeLimit: number;
    waitingForNext: Promise<void>;
    resolveNext: () => void;
    constructor(activeLimit: number);
    run(callback: () => Promise<any>): Promise<any>;
    finish(): Promise<void>;
    waitForNextFinish(): Promise<void>;
}
