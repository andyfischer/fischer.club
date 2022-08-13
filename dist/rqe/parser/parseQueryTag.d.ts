import { TokenIterator } from './lexer';
import { QueryTag } from '../QueryTuple';
export declare function parseQueryTagFromTokens(it: TokenIterator): QueryTag;
export declare function parseQueryTag(str: string): QueryTag;
