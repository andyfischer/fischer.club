import { MountSpec } from '../Schema';
import { MountPointSpec } from '../MountPoint';
export interface ObjectMountConfig {
    object: any;
    func: string;
    mount?: MountSpec;
    name?: string;
    namespace?: string[];
}
export declare function setupObject(opts: ObjectMountConfig): MountPointSpec[];
