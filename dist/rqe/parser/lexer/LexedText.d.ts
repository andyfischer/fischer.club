import Token from './Token';
export default class LexedText {
    tokens: Token[];
    originalStr: string;
    constructor(originalStr: string);
    getTokenText(token: Token): string;
    getUnquotedText(token: Token): string;
    tokenCharIndex(tokenIndex: number): number;
    getTextRange(startPos: number, endPos: number): string;
    stripSpacesAndNewlines(): void;
}
