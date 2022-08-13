"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFunctionWithJavascriptMagic = exports.getFunctionParameterNames = void 0;
const parseTableDecl_1 = require("./parser/parseTableDecl");
const FunctionRegex = /.*?\((.*?)\)/;
function getFunctionParameterNames(func) {
    const str = func.toString();
    const match = FunctionRegex.exec(str);
    let argsStr;
    if (match) {
        argsStr = match[1];
    }
    else {
        argsStr = str.slice(0, str.indexOf('=>')).trim();
    }
    const args = argsStr.split(',')
        .map(arg => arg.trim())
        .filter(arg => arg !== '');
    return args;
}
exports.getFunctionParameterNames = getFunctionParameterNames;
function setupFunctionWithJavascriptMagic(decl, func) {
    const mount = (0, parseTableDecl_1.parseTableDecl)(decl);
    const args = getFunctionParameterNames(func);
    mount.run = (step) => {
        const argValues = args.map(argName => {
            if (argName === 'task')
                return step;
            if (argName === 'step')
                return step;
            if (argName === 'query')
                return (q, p) => step.query(q, p);
            if (argName === 'item')
                return step.args();
            if (argName === 'graph')
                return step.graph;
            return step.getOptional(argName, null);
        });
        return func.apply(null, argValues);
    };
    return mount;
}
exports.setupFunctionWithJavascriptMagic = setupFunctionWithJavascriptMagic;
//# sourceMappingURL=JavascriptMagic.js.map