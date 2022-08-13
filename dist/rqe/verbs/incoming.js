"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incoming = void 0;
function run(step) {
    const { tuple, input, output } = step;
    const args = step.argsQuery();
    if (step.schemaOnly) {
        output.put(args.toItemValue());
        output.done();
        return;
    }
    input.sendTo(output);
}
exports.incoming = {
    run,
};
//# sourceMappingURL=incoming.js.map