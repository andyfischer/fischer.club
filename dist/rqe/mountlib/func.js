"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFunction = void 0;
const parseTableDecl_1 = require("../parser/parseTableDecl");
function itemCallbackToHandler(callback) {
    return (step) => {
        const input = step.args();
        const data = callback(input, step);
        return data;
    };
}
function setupFunction(decl, callback) {
    const mount = (0, parseTableDecl_1.parseTableDecl)(decl);
    mount.run = itemCallbackToHandler(callback);
    return mount;
}
exports.setupFunction = setupFunction;
//# sourceMappingURL=func.js.map