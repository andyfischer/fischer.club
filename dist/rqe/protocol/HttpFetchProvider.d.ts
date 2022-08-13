import { UseConfig } from './ProtocolCommon';
import { Graph } from '../Graph';
interface RequestOptions {
    method: string;
    headers: any;
    body: any;
}
interface Config {
    graph: Graph;
    use?: UseConfig;
    url: string;
    fetch: any;
    fixOutgoingRequest?: (opts: RequestOptions) => RequestOptions;
}
export declare function connectHttpFetchClient(config: Config): void;
export {};
