"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.save_to_csv = void 0;
function run(step) {
    if (step.schemaOnly) {
        step.output.done();
        return;
    }
    const { filename } = step.argsQuery().toItemValue();
    if (!filename)
        throw new Error('save_to_csv requires: filename');
    throw new Error('save_to_csv: need to update to not call "fs"');
}
exports.save_to_csv = {
    run,
};
//# sourceMappingURL=save_to_csv.js.map