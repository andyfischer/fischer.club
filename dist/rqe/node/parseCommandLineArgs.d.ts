import { QueryTag } from '../QueryTuple';
export interface ParsedCommandLineArgs {
    flags: {
        name: string;
        value?: any;
    }[];
    tags: QueryTag[];
    query?: string;
}
export declare function parseCommandLineArgs(args: string): ParsedCommandLineArgs;
