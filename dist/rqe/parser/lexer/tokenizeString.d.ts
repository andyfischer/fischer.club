import { TokenIterator } from './TokenIterator';
import LexedText from './LexedText';
import { LexerSettings } from './LexerSettings';
export declare function tokenizeString(str: string, settings?: LexerSettings): LexedText;
export declare function lexStringToIterator(str: string, settings?: LexerSettings): TokenIterator;
