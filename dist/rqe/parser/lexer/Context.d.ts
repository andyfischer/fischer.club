import { Token } from '.';
import TokenDef from './TokenDef';
import { LexerSettings } from './LexerSettings';
interface BracketFrame {
    startedAtIndex: number;
    lookingFor: string;
}
export default class Context {
    str: string;
    index: number;
    tokenIndex: number;
    isIterator: boolean;
    lineNumber: number;
    charNumber: number;
    leadingIndent: number;
    resultTokens: Token[];
    bracketStack: BracketFrame[];
    settings: LexerSettings;
    constructor(str: string, settings: LexerSettings);
    finished(lookahead?: number): boolean;
    next(lookahead?: number): number;
    nextChar(lookahead?: number): string;
    position(): number;
    getTokenText(token: Token): string;
    consume(match: TokenDef, len: number): import("./Token").default;
    consumeWhile(match: TokenDef, matcher: (c: number) => boolean): import("./Token").default;
}
export {};
