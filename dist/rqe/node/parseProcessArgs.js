"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProcessArgs = void 0;
const parseQuery_1 = require("../parser/parseQuery");
function parseProcessArgs() {
    const str = process.argv.slice(2).join(' ');
    const query = (0, parseQuery_1.parseQuery)(str);
    return query;
}
exports.parseProcessArgs = parseProcessArgs;
//# sourceMappingURL=parseProcessArgs.js.map