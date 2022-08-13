"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTableDecl = exports.parseTableDeclFromTokensV2 = exports.parseTableDeclFromTokens = void 0;
const lexer_1 = require("./lexer");
const parseQueryTag_1 = require("./parseQueryTag");
function parseTableDeclFromTokens(it, ctx) {
    const out = {
        t: 'mountPointSpec',
        attrs: {},
    };
    let hasSeenArrow = false;
    while (!it.finished()) {
        it.skipSpaces();
        if (it.finished())
            break;
        if (it.tryConsume(lexer_1.t_right_arrow)) {
            hasSeenArrow = true;
            continue;
        }
        if (it.tryConsume(lexer_1.t_colon)) {
            for (const config of Object.values(out.attrs))
                config.requiresValue = false;
            continue;
        }
        const tag = (0, parseQueryTag_1.parseQueryTagFromTokens)(it);
        if (tag.specialAttr)
            throw new Error("star not supported in table decl");
        const resultAttr = {
            required: !hasSeenArrow,
            requiresValue: !hasSeenArrow,
        };
        out.attrs[tag.attr] = resultAttr;
        if (tag.value.t !== 'no_value') {
            if (hasSeenArrow)
                throw new Error("can't add tags with values after ->");
            resultAttr.specificValue = tag.value;
            resultAttr.requiresValue = false;
        }
    }
    return out;
}
exports.parseTableDeclFromTokens = parseTableDeclFromTokens;
function parseTableDeclFromTokensV2(it, ctx) {
    const out = {
        t: 'mountPointSpec',
        attrs: {},
    };
    let hasSeenArrow = false;
    while (!it.finished()) {
        it.skipSpaces();
        if (it.finished())
            break;
        if (it.tryConsume(lexer_1.t_right_arrow)) {
            hasSeenArrow = true;
            continue;
        }
        const tag = (0, parseQueryTag_1.parseQueryTagFromTokens)(it);
        if (tag.specialAttr)
            throw new Error("star not supported in table decl");
        const resultAttr = {
            required: !tag.isOptional && !hasSeenArrow,
            requiresValue: (tag.identifier != null) && !hasSeenArrow,
        };
        out.attrs[tag.attr] = resultAttr;
        if (tag.value.t !== 'no_value') {
            resultAttr.specificValue = tag.value;
            resultAttr.requiresValue = false;
        }
    }
    return out;
}
exports.parseTableDeclFromTokensV2 = parseTableDeclFromTokensV2;
function parseTableDecl(str) {
    if (str.startsWith('[v2]')) {
        str = str.replace('[v2]', '');
        const it = (0, lexer_1.lexStringToIterator)(str);
        const result = parseTableDeclFromTokensV2(it, {});
        if (result.t === 'parseError') {
            throw new Error(`parse error on "${str}": ` + result);
        }
        return result;
    }
    const it = (0, lexer_1.lexStringToIterator)(str);
    const result = parseTableDeclFromTokens(it, {});
    if (result.t === 'parseError') {
        throw new Error(`parse error on "${str}": ` + result);
    }
    return result;
}
exports.parseTableDecl = parseTableDecl;
//# sourceMappingURL=parseTableDecl.js.map