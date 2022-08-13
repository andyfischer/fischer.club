import { QueryAsObject } from '../Query';
import { StreamEvent } from '../Stream';
import { MountSpec, MountPointSpec, LooseMountPointSpec } from '../MountPoint';
import { Graph } from '../Graph';
export interface ServeConfig {
    shouldServe: (point: MountPointSpec) => boolean;
}
export interface UseConfig {
    expectedApi?: LooseMountPointSpec[];
    discoverApi?: boolean;
    connectionAttr?: string;
}
export interface QueryMessage {
    t: 'query';
    query: QueryAsObject;
    inputId: number;
    outputId: number;
}
export interface StreamInputMessage {
    t: 'streamInput';
    streamId: number;
    msg: StreamEvent;
}
export interface StreamOutputMessage {
    t: 'streamOutput';
    streamId: number;
    msg: StreamEvent;
}
export interface ConnectMessage {
    t: 'connect';
    cid: number;
    discoverApi: boolean;
}
export interface ModuleEntry {
    id: any;
    points: MountPointSpec[];
}
export interface ConnectReply {
    t: 'connectReply';
    modules: ModuleEntry[];
    cid: number;
}
export interface UpdateModuleMessage {
    t: 'updateModule';
    moduleId: number;
    spec: MountSpec;
}
export interface UsageErrorMessage {
    t: 'usageError';
    message: string;
}
export declare type Message = ConnectMessage | ConnectReply | QueryMessage | StreamInputMessage | StreamOutputMessage | UpdateModuleMessage | UsageErrorMessage;
declare type OnSchemaChange = (moduleId: number, spec: MountSpec) => void;
export declare function addSchemaUpdateListener(graph: Graph, serve: ServeConfig, onSchemaChange: OnSchemaChange): void;
export {};
