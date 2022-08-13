import { Stream } from '../Stream';
export declare function tee(input: Stream, count: number): Stream[];
export declare function joinStreams(count: number, output: Stream): Stream[];
