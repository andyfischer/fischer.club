import { QueryLike } from '../Query';
import { MountPointSpec } from '../MountPoint';
interface Config {
    fetchJson: QueryLike;
    jsonRootPath?: string;
    func: string;
    upstreamAttrs: string[];
}
export declare function getJsonMount(config: Config): MountPointSpec[];
export {};
