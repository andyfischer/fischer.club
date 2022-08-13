"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const Runtime_1 = require("../Runtime");
function run(step) {
    var _a;
    if (((_a = step.plannedStep.staticMatch) === null || _a === void 0 ? void 0 : _a.t) === 'found') {
        return (0, Runtime_1.callMountPoint)(step, step.plannedStep.staticMatch.match, step.afterVerb, step.input, step.output);
    }
    return (0, Runtime_1.findAndCallMountPoint)(step, step.afterVerb, step.input, step.output);
}
exports.get = {
    run,
    name: 'get',
};
//# sourceMappingURL=get.js.map