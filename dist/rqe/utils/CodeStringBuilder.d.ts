import { IDSource } from './IDSource';
interface Options {
    ts?: boolean;
}
export declare class CodeStringBuilder {
    options: Options;
    lines: string[];
    indentLevel: number;
    nextLocal: IDSource;
    constructor(options?: Options);
    ts(s: string): string;
    indent(): string;
    comment(s: string): void;
    openBlock(...strs: string[]): void;
    closeBlock(...strs: string[]): void;
    line(...strs: Array<string | string[]>): void;
    str(): string;
}
export {};
