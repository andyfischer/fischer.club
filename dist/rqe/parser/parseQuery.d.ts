import { TokenIterator } from './lexer';
import { ParseError } from './ParseError';
import { Query } from '../Query';
interface ParseContext {
}
export declare function parseQueryFromTokens(it: TokenIterator, ctx: ParseContext): Query | ParseError;
export declare function parseQuery(str: string, ctx?: ParseContext): Query | ParseError;
export {};
