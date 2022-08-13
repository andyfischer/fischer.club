"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeStringBuilder = void 0;
const IDSource_1 = require("./IDSource");
class CodeStringBuilder {
    constructor(options = {}) {
        this.lines = [];
        this.indentLevel = 0;
        this.nextLocal = new IDSource_1.IDSource('local_');
        this.options = options;
    }
    ts(s) {
        if (this.options.ts)
            return s;
        return '';
    }
    indent() {
        return '  '.repeat(this.indentLevel);
    }
    comment(s) {
        this.line('// ' + s);
    }
    openBlock(...strs) {
        this.lines.push(this.indent() + strs.flat(10).join(''));
        this.indentLevel += 1;
    }
    closeBlock(...strs) {
        this.indentLevel -= 1;
        this.lines.push(this.indent() + strs.flat(10).join(''));
    }
    line(...strs) {
        this.lines.push(this.indent() + strs.flat(10).join(''));
    }
    str() {
        return this.lines.join('\n');
    }
}
exports.CodeStringBuilder = CodeStringBuilder;
//# sourceMappingURL=CodeStringBuilder.js.map