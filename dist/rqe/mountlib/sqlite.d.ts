import { MountPointSpec } from '../MountPoint';
interface Config {
    db: any;
    tableName?: string;
    attrs: string;
    location: string;
    funcs: string[];
    debugSql?: boolean;
}
export declare function getSqliteTableMount(config: Config): MountPointSpec[];
export {};
