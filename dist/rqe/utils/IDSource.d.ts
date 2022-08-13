export declare class IDSourceNumber {
    next: number;
    copyFrom(source: IDSourceNumber): void;
    take(): number;
}
export declare class IDSource {
    prefix: string;
    next: number;
    constructor(prefix?: string);
    take(): string;
}
