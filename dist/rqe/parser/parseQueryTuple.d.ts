import { TokenIterator } from './lexer';
import { ParseError } from './ParseError';
import { QueryTuple } from '../QueryTuple';
export declare function parseQueryTupleFromTokens(it: TokenIterator): QueryTuple | ParseError;
export declare function parseQueryTuple(str: string): QueryTuple | ParseError;
export declare function parseQueryTupleWithErrorCheck(str: string): QueryTuple;
