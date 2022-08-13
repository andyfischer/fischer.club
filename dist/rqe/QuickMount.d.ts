import { Graph } from './Graph';
import { MountPoint, MountPointSpec } from './MountPoint';
export declare function quickMountJavascriptFunction(func: Function): MountPointSpec;
export declare function javascriptQuickMountIntoGraph(graph: Graph, func: Function): MountPoint;
export declare function setObjectMetadata(obj: any, field: string, value: any): void;
export declare function getObjectMetadata(obj: any, field: string): any;
export declare function getMetadataForGraph(graph: Graph, obj: any, field: string): any;
export declare function setMetadataForGraph(graph: Graph, obj: any, field: string, value: any): void;
