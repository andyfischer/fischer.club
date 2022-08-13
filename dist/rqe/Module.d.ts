import { MountPoint, MountPointSpec } from './MountPoint';
import { Graph } from './Graph';
import { IDSourceNumber as IDSource } from './utils/IDSource';
import { ItemChangeListener } from './reactive/ItemChangeEvent';
export declare class Module {
    graph: Graph;
    moduleId: string;
    points: MountPoint[];
    pointIds: IDSource;
    pointsById: Map<number, MountPoint>;
    pointsByDeclString: Map<string, MountPoint>;
    constructor(graph: Graph);
    redefine(newSpecs: MountPointSpec[]): void;
    clear(): void;
    sendUpdate(listener: ItemChangeListener): void;
}
