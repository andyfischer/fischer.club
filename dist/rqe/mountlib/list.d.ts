interface AttrConfig {
}
export interface ListMountConfig {
    items: any[];
    attrs?: {
        [attr: string]: AttrConfig;
    };
}
export declare function getListMount(config: ListMountConfig): import("../MountPoint").MountPointSpec[];
export {};
