"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuery = exports.parseQueryFromTokens = void 0;
const lexer_1 = require("./lexer");
const parseQueryTuple_1 = require("./parseQueryTuple");
const Query_1 = require("../Query");
function parseQueryFromTokens(it, ctx) {
    const steps = [];
    let isFirst = true;
    let isTransform = false;
    while (!it.finished()) {
        it.skipSpaces();
        if (it.finished())
            break;
        if (it.nextIs(lexer_1.t_bar) || it.nextIs(lexer_1.t_slash)) {
            if (isFirst)
                isTransform = true;
            it.consume();
            continue;
        }
        const step = (0, parseQueryTuple_1.parseQueryTupleFromTokens)(it);
        if (step.t === 'parseError')
            return step;
        steps.push(step);
        if (!it.tryConsume(lexer_1.t_bar) && !it.tryConsume(lexer_1.t_slash))
            break;
        isFirst = false;
    }
    return new Query_1.Query(steps, { isTransform });
}
exports.parseQueryFromTokens = parseQueryFromTokens;
function parseQuery(str, ctx = {}) {
    try {
        const it = (0, lexer_1.lexStringToIterator)(str);
        return parseQueryFromTokens(it, ctx);
    }
    catch (err) {
        console.error('error parsing: ', str);
        throw err;
    }
}
exports.parseQuery = parseQuery;
//# sourceMappingURL=parseQuery.js.map