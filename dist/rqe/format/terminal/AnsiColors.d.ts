import { Color } from '../../repl/Colors';
export declare function colorize(color: Color, str: string): string;
export declare function colorizeBg(color: Color, str: string): string;
export declare const black: (str: any) => string;
export declare const red: (str: any) => string;
export declare const green: (str: any) => string;
export declare const yellow: (str: any) => string;
export declare const grey: (str: any) => string;
export declare const greenBg: (str: any) => string;
export declare const redBg: (str: any) => string;
export declare const yellowBg: (str: any) => string;
export declare function ansiRegex({ onlyFirst }?: {
    onlyFirst?: boolean;
}): RegExp;
export declare function stripAnsi(s: string): string;
