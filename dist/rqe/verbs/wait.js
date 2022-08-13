"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = void 0;
function run(step) {
    const duration = parseInt(step.get('duration'), 10);
    setTimeout(() => {
        step.input.sendTo(step.output);
    }, duration);
}
exports.wait = {
    run,
};
//# sourceMappingURL=wait.js.map