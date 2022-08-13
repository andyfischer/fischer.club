import { TokenIterator } from './lexer';
import { MountPointSpec } from '../MountPoint';
import { ParseError } from './ParseError';
interface ParseContext {
}
export declare function parseTableDeclFromTokens(it: TokenIterator, ctx: ParseContext): MountPointSpec | ParseError;
export declare function parseTableDeclFromTokensV2(it: TokenIterator, ctx: ParseContext): MountPointSpec | ParseError;
export declare function parseTableDecl(str: string): MountPointSpec;
export {};
