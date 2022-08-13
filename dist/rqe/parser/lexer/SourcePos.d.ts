export default interface SourcePos {
    filename?: string;
    lineStart: number;
    lineEnd: number;
    columnStart: number;
    columnEnd: number;
    posStart: number;
    posEnd: number;
}
export declare function sourcePosToString(pos: SourcePos): string;
