"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenIterator = void 0;
const _1 = require(".");
class TokenIterator {
    constructor(text, settings = {}) {
        this.position = 0;
        this.tokens = text.tokens;
        this.sourceText = text;
        this.settings = settings;
        this.autoSkip();
    }
    getPosition() {
        return this.position;
    }
    restore(position) {
        this.position = position;
    }
    copy() {
        const it = new TokenIterator(this.sourceText);
        it.position = this.position;
        return it;
    }
    next(lookahead = 0) {
        const pos = this.position + lookahead;
        if (pos < 0) {
            return {
                startPos: 0,
                endPos: 0,
                tokenIndex: 0,
                length: 0,
                lineStart: 0,
                columnStart: 0,
                leadingIndent: 0,
                match: null
            };
        }
        if (pos >= this.tokens.length) {
            const lastToken = this.tokens[this.tokens.length - 1];
            if (!lastToken) {
                return {
                    startPos: 0,
                    endPos: 0,
                    tokenIndex: -1,
                    length: 0,
                    lineStart: 0,
                    columnStart: 0,
                    leadingIndent: 0,
                    match: null
                };
            }
            return {
                startPos: lastToken.endPos,
                endPos: lastToken.endPos,
                tokenIndex: -1,
                length: 0,
                lineStart: lastToken.lineStart,
                columnStart: lastToken.columnStart + lastToken.length,
                leadingIndent: lastToken.leadingIndent,
                match: null
            };
        }
        return this.tokens[pos];
    }
    nextIs(match, lookahead = 0) {
        const token = this.next(lookahead);
        return token.match === match;
    }
    nextText(lookahead = 0) {
        const token = this.next(lookahead);
        return this.sourceText.getTokenText(token);
    }
    nextIsIdentifier(str, lookahead = 0) {
        return this.nextIs(_1.t_ident, lookahead) && this.nextText(lookahead) === str;
    }
    nextUnquotedText(lookahead = 0) {
        const token = this.next(lookahead);
        return this.sourceText.getUnquotedText(token);
    }
    nextLength(lookahead = 0) {
        const token = this.next(lookahead);
        return token.endPos - token.startPos;
    }
    finished(lookahead = 0) {
        return (this.position + lookahead) >= this.tokens.length;
    }
    advance() {
        this.position += 1;
        this.autoSkip();
    }
    jumpTo(pos) {
        this.position = pos;
        this.autoSkip();
    }
    consume(match = null) {
        var _a;
        if (match !== null && !this.nextIs(match))
            throw new Error(`expected token: ${match === null || match === void 0 ? void 0 : match.name}, found: ${(_a = this.next().match) === null || _a === void 0 ? void 0 : _a.name} (${this.nextText()})`);
        this.advance();
    }
    consumeWhile(condition) {
        while (!this.finished() && condition(this.next()))
            this.advance();
    }
    consumeIdentifier(s) {
        if (!this.nextIsIdentifier(s)) {
            throw new Error(`consume expected identifier: "${s}, found: ${this.nextText()}`);
        }
        this.advance();
    }
    consumeAsText(lookahead = 0) {
        const str = this.nextText(lookahead);
        this.consume();
        return str;
    }
    consumeAsUnquotedText(lookahead = 0) {
        const str = this.nextUnquotedText(lookahead);
        this.consume();
        return str;
    }
    consumeAsTextWhile(condition) {
        let str = '';
        let stuckCounter = 0;
        while (!this.finished() && condition(this.next())) {
            str += this.consumeAsText();
            stuckCounter += 1;
            if (stuckCounter > 10000) {
                throw new Error("infinite loop in consumeAsTextWhile?");
            }
        }
        return str;
    }
    tryConsume(match) {
        if (this.nextIs(match)) {
            this.consume();
            return true;
        }
        return false;
    }
    skipWhile(condition) {
        while (condition(this.next()) && !this.finished())
            this.consume();
    }
    skipUntilNewline() {
        this.skipWhile(token => token.match !== _1.t_newline);
        if (this.nextIs(_1.t_newline))
            this.consume();
    }
    autoSkip() {
        if (!this.settings.autoSkipSpaces && !this.settings.autoSkipNewlines)
            return;
        while (true) {
            if (this.settings.autoSkipSpaces && this.nextIs(_1.t_space))
                this.consume(_1.t_space);
            else if (this.settings.autoSkipNewlines && this.nextIs(_1.t_newline))
                this.consume(_1.t_newline);
            else
                break;
        }
    }
    skipSpaces() {
        while (this.nextIs(_1.t_space))
            this.consume(_1.t_space);
    }
    skipNewlines() {
        while (this.nextIs(_1.t_space) || this.nextIs(_1.t_newline))
            this.consume();
    }
    lookaheadSkipSpaces(lookahead = 0) {
        while (this.nextIs(_1.t_space, lookahead))
            lookahead++;
        return lookahead;
    }
    lookaheadAdvance(lookahead) {
        lookahead++;
        if (this.nextIs(_1.t_space, lookahead))
            lookahead++;
    }
    consumeSpace() {
        while (this.nextIs(_1.t_space))
            this.consume(_1.t_space);
    }
    consumeWhitespace() {
        while (this.nextIs(_1.t_space) || this.nextIs(_1.t_newline))
            this.consume();
    }
    toSourcePos(firstToken, lastToken) {
        return {
            posStart: firstToken.startPos,
            posEnd: lastToken.endPos,
            lineStart: firstToken.lineStart,
            columnStart: firstToken.columnStart,
            lineEnd: firstToken.lineStart,
            columnEnd: lastToken.columnStart + lastToken.length
        };
    }
    spanToString(startPos, endPos) {
        const startToken = this.tokens[startPos];
        const endToken = this.tokens[endPos];
        return this.sourceText.originalStr.slice(startToken.startPos, endToken.endPos);
    }
}
exports.TokenIterator = TokenIterator;
//# sourceMappingURL=TokenIterator.js.map