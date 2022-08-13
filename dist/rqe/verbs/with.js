"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._with = void 0;
function run(step) {
    const { tuple, input, output } = step;
    const args = step.argsQuery().toItemValue();
    input.transform(output, (item) => {
        return {
            ...item,
            ...args
        };
    });
}
exports._with = {
    run,
};
//# sourceMappingURL=with.js.map