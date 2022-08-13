import { Verb } from './_shared';
import { QueryTuple } from '../QueryTuple';
export declare function everyVerb(): {
    [name: string]: any;
};
export declare function getVerb(verb: string): Verb;
export declare function listEveryVerb(): string[];
export declare function findBuiltinVerb(tuple: QueryTuple): Verb;
