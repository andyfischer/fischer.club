"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeclaredQuery = void 0;
const Query_1 = require("./Query");
class DeclaredQuery {
    constructor(graph, queryLike) {
        this.graph = graph;
        this.query = (0, Query_1.toQuery)(queryLike);
    }
    run(parameters) {
        return this.graph.query(this.query, parameters);
    }
}
exports.DeclaredQuery = DeclaredQuery;
//# sourceMappingURL=DeclaredQuery.js.map