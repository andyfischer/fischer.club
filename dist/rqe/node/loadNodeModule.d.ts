import { Graph } from '../Graph';
import { MountPointSpec } from '../MountPoint';
export declare function getSetupFromModule(moduleContents: any): MountPointSpec[];
export declare function runSetupFromModule(graph: Graph, moduleContents: any): import("../Module").Module;
