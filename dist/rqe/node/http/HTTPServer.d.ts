/// <reference types="node" />
import * as http from 'http';
import { Graph } from '../../Graph';
export declare function createHttpServer(graph: Graph): {
    http_routes: import("../..").Table<unknown>;
    server: http.Server;
};
