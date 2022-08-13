export interface ValueDiff {
    equal: boolean;
    path?: any[];
    description?: string;
}
export declare function diffValues(value: any, other: any): any;
