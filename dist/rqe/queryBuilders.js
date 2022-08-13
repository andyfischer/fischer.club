"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.where = exports.add = void 0;
const Query_1 = require("./Query");
const QueryTuple_1 = require("./QueryTuple");
function add(...queries) {
    let combinedSteps = [];
    if (queries.length === 0) {
        return new Query_1.Query([]);
    }
    for (const queryLike of queries) {
        combinedSteps = combinedSteps.concat((0, Query_1.toQuery)(queryLike).steps);
    }
    return new Query_1.Query(combinedSteps);
}
exports.add = add;
function where(looseLhs, looseWhereCondition) {
    const lhs = (0, Query_1.toQuery)(looseLhs);
    const where = (0, QueryTuple_1.toQueryTuple)(looseWhereCondition);
    where.addTag({ t: 'tag', attr: 'where', value: { t: 'no_value' } });
    return new Query_1.Query(lhs.steps.concat([where]));
}
exports.where = where;
//# sourceMappingURL=queryBuilders.js.map