"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.mount = exports.declareQuery = exports.func = exports.query = exports.newTable = exports.getGraph = void 0;
const Graph_1 = require("./Graph");
const DeclaredQuery_1 = require("./DeclaredQuery");
const JavascriptMagic_1 = require("./JavascriptMagic");
let _processGlobalGraph = null;
function getGraph() {
    if (!_processGlobalGraph)
        _processGlobalGraph = new Graph_1.Graph();
    return _processGlobalGraph;
}
exports.getGraph = getGraph;
function newTable(schema) {
    return getGraph().newTable(schema);
}
exports.newTable = newTable;
function query(queryLike, parameters = {}, context = {}) {
    return getGraph().query(queryLike, parameters, context);
}
exports.query = query;
function func(decl, func) {
    getGraph().mount([(0, JavascriptMagic_1.setupFunctionWithJavascriptMagic)(decl, func)]);
}
exports.func = func;
function declareQuery(query) {
    return new DeclaredQuery_1.DeclaredQuery(getGraph(), query);
}
exports.declareQuery = declareQuery;
function mount(points) {
    getGraph().mount(points);
}
exports.mount = mount;
function log(category, text) {
    getGraph().logging.put(category, text);
}
exports.log = log;
//# sourceMappingURL=globalGraph.js.map