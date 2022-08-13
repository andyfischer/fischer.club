"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.value = void 0;
function run(step) {
    const { output } = step;
    output.put(step.args());
    output.done();
}
exports.value = {
    run,
};
//# sourceMappingURL=value.js.map