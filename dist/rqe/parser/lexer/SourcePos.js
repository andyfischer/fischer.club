"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourcePosToString = void 0;
function sourcePosToString(pos) {
    const filename = pos.filename || '(no filename)';
    return `${filename}:${pos.lineStart}:${pos.columnStart}`;
}
exports.sourcePosToString = sourcePosToString;
//# sourceMappingURL=SourcePos.js.map