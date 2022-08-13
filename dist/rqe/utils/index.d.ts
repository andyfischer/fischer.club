export declare function print(...args: string[]): void;
export declare function printError(err: any): void;
export declare function toSet(items: string[]): {
    [key: string]: boolean;
};
export declare function freeze(value: any): any;
export declare function allTrue(items: boolean[]): boolean;
export declare function values(obj: any): any[];
export declare function timedOut(p: Promise<any>, ms: number): Promise<boolean>;
export declare function isRunningInNode(): any;
export declare function zeroPad(num: number | string, len: number): string;
