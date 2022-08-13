"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unescape_1 = __importDefault(require("./unescape"));
const tokens_1 = require("./tokens");
class LexedText {
    constructor(originalStr) {
        this.originalStr = originalStr;
    }
    getTokenText(token) {
        return this.originalStr.slice(token.startPos, token.endPos);
    }
    getUnquotedText(token) {
        if (token.match === tokens_1.t_quoted_string) {
            const str = this.originalStr.slice(token.startPos + 1, token.endPos - 1);
            return (0, unescape_1.default)(str);
        }
        return this.getTokenText(token);
    }
    tokenCharIndex(tokenIndex) {
        if (tokenIndex >= this.tokens.length)
            return this.originalStr.length;
        return this.tokens[tokenIndex].startPos;
    }
    getTextRange(startPos, endPos) {
        let out = '';
        for (let i = startPos; i < endPos; i++)
            out += this.getTokenText(this.tokens[i]);
        return out;
    }
    stripSpacesAndNewlines() {
        this.tokens = this.tokens.filter(tok => {
            if (tok.match === tokens_1.t_space)
                return false;
            if (tok.match === tokens_1.t_newline)
                return false;
            return true;
        });
    }
}
exports.default = LexedText;
//# sourceMappingURL=LexedText.js.map