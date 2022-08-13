"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryTupleWithErrorCheck = exports.parseQueryTuple = exports.parseQueryTupleFromTokens = void 0;
const lexer_1 = require("./lexer");
const parseQueryTag_1 = require("./parseQueryTag");
const QueryTuple_1 = require("../QueryTuple");
function maybeParseVerbWithCount(it) {
    let startPos = it.position;
    if (it.nextText() !== "limit" && it.nextText() !== "last")
        return null;
    const verb = it.nextText();
    it.consume();
    it.skipSpaces();
    if (!it.nextIs(lexer_1.t_integer)) {
        it.position = startPos;
        return null;
    }
    const count = it.nextText();
    it.consume(lexer_1.t_integer);
    const tags = [{
            t: 'tag',
            attr: verb,
            value: { t: 'no_value' },
        }, {
            t: 'tag',
            attr: 'count',
            value: { t: 'str_value', str: count },
        }];
    for (const entry of parseTags(it)) {
        tags.push(entry);
    }
    return tags;
}
function maybeParseWaitVerb(it) {
    let startPos = it.position;
    if (it.nextText() !== "wait")
        return null;
    const verb = it.nextText();
    it.consume();
    it.skipSpaces();
    if (!it.nextIs(lexer_1.t_integer)) {
        it.position = startPos;
        return null;
    }
    const duration = it.nextText();
    it.consume(lexer_1.t_integer);
    const tags = [{
            t: 'tag',
            attr: verb,
            value: { t: 'no_value' },
        }, {
            t: 'tag',
            attr: 'duration',
            value: { t: 'str_value', str: duration },
        }];
    for (const tag of parseTags(it)) {
        tags.push(tag);
    }
    return tags;
}
function maybeParseRename(it) {
    let startPos = it.position;
    if (it.nextText() !== "rename")
        return null;
    const verb = it.nextText();
    it.consume();
    it.skipSpaces();
    let from;
    let to;
    if (!it.nextIs(lexer_1.t_plain_value)) {
        it.position = startPos;
        return null;
    }
    from = it.consumeAsText();
    it.skipSpaces();
    if (!it.nextIs(lexer_1.t_right_arrow)) {
        it.position = startPos;
        return null;
    }
    it.consume(lexer_1.t_right_arrow);
    it.skipSpaces();
    if (!it.nextIs(lexer_1.t_plain_value)) {
        it.position = startPos;
        return null;
    }
    to = it.consumeAsText();
    const tags = [{
            t: 'tag',
            attr: verb,
            value: { t: 'no_value' },
        }, {
            t: 'tag',
            attr: 'from',
            value: { t: 'str_value', str: from },
        }, {
            t: 'tag',
            attr: 'to',
            value: { t: 'str_value', str: to },
        }];
    for (const tag of parseTags(it)) {
        tags.push(tag);
    }
    return tags;
}
function maybeParseWhere(it) {
    let startPos = it.position;
    if (it.nextText() !== "where")
        return null;
    it.consume();
    it.skipSpaces();
    const conditions = [];
}
const specialSyntaxPaths = [
    maybeParseVerbWithCount,
    maybeParseRename,
    maybeParseWaitVerb,
];
function* parseTags(it) {
    while (true) {
        it.skipSpaces();
        if (it.finished() || it.nextIs(lexer_1.t_newline) || it.nextIs(lexer_1.t_bar) || it.nextIs(lexer_1.t_slash) || it.nextIs(lexer_1.t_rparen))
            break;
        const tag = (0, parseQueryTag_1.parseQueryTagFromTokens)(it);
        yield tag;
    }
}
function parseQueryTupleFromTokens(it) {
    it.skipSpaces();
    for (const path of specialSyntaxPaths) {
        const parseSuccess = path(it);
        if (parseSuccess)
            return new QueryTuple_1.QueryTuple(parseSuccess);
    }
    let tags = [];
    for (const tag of parseTags(it)) {
        tags.push(tag);
    }
    if (tags.length === 0) {
        return {
            t: 'parseError',
            parsing: 'queryTuple',
            message: 'No verb found'
        };
    }
    return new QueryTuple_1.QueryTuple(tags);
}
exports.parseQueryTupleFromTokens = parseQueryTupleFromTokens;
function parseQueryTuple(str) {
    const it = (0, lexer_1.lexStringToIterator)(str);
    return parseQueryTupleFromTokens(it);
}
exports.parseQueryTuple = parseQueryTuple;
function parseQueryTupleWithErrorCheck(str) {
    const result = parseQueryTuple(str);
    if (result.t === 'parseError')
        throw new Error("Parse error: " + str);
    return result;
}
exports.parseQueryTupleWithErrorCheck = parseQueryTupleWithErrorCheck;
//# sourceMappingURL=parseQueryTuple.js.map