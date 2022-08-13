import { Graph } from '../Graph';
import { ErrorItem } from '../Errors';
import { QueryLike } from '../Query';
interface Options {
    graph: Graph;
    beforeQuery?: (query: QueryLike, params?: any) => void;
    onUnhandledException?: (err: Error) => void;
    onInternalError?: (err: ErrorItem) => void;
}
export declare function rqeQueryExpressEndpoint(opts: Options): (req: any, res: any) => void;
export {};
