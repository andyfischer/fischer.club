/// <reference types="node" />
import HTTP from 'http';
import { Graph } from '../../Graph';
interface Options {
    graph: Graph;
    ws: any;
    port: number;
    onQuery?: (conn: any, query: any) => void;
    onConnection?: () => void;
    onListen?: (port: any) => void;
}
export declare function createSocketServer(options: Options): HTTP.Server;
export {};
