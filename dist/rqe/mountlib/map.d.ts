import { MountPointSpec } from '../MountPoint';
export interface MapMountConfig {
    map: Map<any, any>;
    func: string;
    name?: string;
    namespace?: string[];
}
export declare function setupMap(opts: MapMountConfig): MountPointSpec[];
