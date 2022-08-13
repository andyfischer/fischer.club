"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = void 0;
function run(step) {
    const { input, output } = step;
    if (step.schemaOnly) {
        output.put({ count: null });
        output.done();
        return;
    }
    let count = 0;
    input.sendTo({
        receive(data) {
            switch (data.t) {
                case 'done': {
                    output.put({ count });
                    output.done();
                    break;
                }
                case 'item': {
                    count++;
                    break;
                }
                default:
                    output.receive(data);
            }
        }
    });
}
exports.count = {
    run,
};
//# sourceMappingURL=count.js.map