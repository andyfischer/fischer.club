"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryTag = exports.parseQueryTagFromTokens = void 0;
const lexer_1 = require("./lexer");
const parseQuery_1 = require("./parseQuery");
function parseQueryTagFromTokens(it) {
    const result = {
        t: 'tag',
        attr: null,
        value: {
            t: 'no_value'
        }
    };
    if (it.tryConsume(lexer_1.t_lbracket)) {
        result.identifier = it.consumeAsText();
        if (!it.tryConsume(lexer_1.t_rbracket))
            throw new Error("expected ']', found: " + it.nextText());
        it.skipSpaces();
    }
    if (it.tryConsume(lexer_1.t_star)) {
        result.specialAttr = { t: 'star' };
        return result;
    }
    if (it.tryConsume(lexer_1.t_dollar)) {
        const unboundVar = it.consumeAsUnquotedText();
        result.attr = unboundVar;
        result.identifier = unboundVar;
        if (it.tryConsume(lexer_1.t_question)) {
            result.isOptional = true;
        }
        return result;
    }
    if (it.tryConsume(lexer_1.t_double_dash))
        result.isFlag = true;
    result.attr = it.consumeAsUnquotedText();
    while (it.nextIs(lexer_1.t_plain_value)
        || it.nextIs(lexer_1.t_dot)
        || it.nextIs(lexer_1.t_dash)
        || it.nextIs(lexer_1.t_integer)
        || it.nextIs(lexer_1.t_slash))
        result.attr += it.consumeAsUnquotedText();
    if (result.attr === '/')
        throw new Error("syntax error, attr was '/'");
    if (it.tryConsume(lexer_1.t_question)) {
        result.isOptional = true;
    }
    if (it.tryConsume(lexer_1.t_lparen)) {
        let query = (0, parseQuery_1.parseQueryFromTokens)(it, {});
        if (query.t === 'parseError')
            throw new Error(query.message);
        result.value = query;
        if (!it.tryConsume(lexer_1.t_rparen))
            throw new Error("Expected )");
        return result;
    }
    if (it.tryConsume(lexer_1.t_equals)) {
        it.skipSpaces();
        if (it.tryConsume(lexer_1.t_lparen)) {
            const query = (0, parseQuery_1.parseQueryFromTokens)(it, {});
            if (query.t === 'parseError')
                throw new Error("Parse error: " + query.t);
            if (!it.tryConsume(lexer_1.t_rparen))
                throw new Error('Expected )');
            result.value = query;
        }
        else {
            let strValue = it.consumeAsUnquotedText();
            while (it.nextIs(lexer_1.t_plain_value) || it.nextIs(lexer_1.t_dot) || it.nextIs(lexer_1.t_slash))
                strValue += it.consumeAsUnquotedText();
            result.value = { t: 'str_value', str: strValue };
        }
    }
    return result;
}
exports.parseQueryTagFromTokens = parseQueryTagFromTokens;
function parseQueryTag(str) {
    const it = (0, lexer_1.lexStringToIterator)(str);
    return parseQueryTagFromTokens(it);
}
exports.parseQueryTag = parseQueryTag;
//# sourceMappingURL=parseQueryTag.js.map