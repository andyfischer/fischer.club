/// <reference types="node" />
import { QueryLike } from '../../Query';
import { Graph } from '../../Graph';
interface ManifestFile {
    shortFilename: string;
    hashedFilename: string;
    buffer?: Buffer;
    hash: string;
}
interface SourceFile {
    fetch: QueryLike;
    shortFilename: string;
}
interface CurrentManifest {
    files: {
        [shortFilename: string]: ManifestFile;
    };
}
export declare class StaticFileManifest {
    graph: Graph;
    sourceFiles: SourceFile[];
    cache: Map<string, ManifestFile>;
    constructor(graph: Graph);
    add(source: SourceFile): void;
    getOneFile(source: SourceFile): Promise<ManifestFile>;
    getManifest(): Promise<CurrentManifest>;
}
export {};
