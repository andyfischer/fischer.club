
import { Graph, QueryExecutionContext } from './Graph'
import { LooseTableSchema } from './Schema'
import { QueryLike } from './Query'
import { DeclaredQuery } from './DeclaredQuery'
import { LogCategory } from './LoggingSubsystem'
import { Stream } from './Stream'
import { MountPointSpec } from './MountPoint'
import { setupFunctionWithJavascriptMagic } from './JavascriptMagic'

let _processGlobalGraph: Graph = null;

export function getGraph(): Graph {
    if (!_processGlobalGraph)
        _processGlobalGraph = new Graph();

    return _processGlobalGraph;
}

export function newTable<T>(schema?: LooseTableSchema) {
    return getGraph().newTable<T>(schema);
}

export function query(queryLike: QueryLike, parameters: any = {}, context: QueryExecutionContext = {}): Stream {
    return getGraph().query(queryLike, parameters, context);
}

export function func(decl: string, func: Function) {
    getGraph().mount([ setupFunctionWithJavascriptMagic(decl, func) ]);

    // future: maybe return HostedFunction here.
}

export function declareQuery(query: QueryLike) {
    return new DeclaredQuery(getGraph(), query);
}

export function mount(points: MountPointSpec[]) {
    getGraph().mount(points);
}

export function log(category: LogCategory, text: string) {
    getGraph().logging.put(category, text);
}

/*
class HostedFunction {
    constructor(graph: Graph, decl: string) {
    }
}
*/
