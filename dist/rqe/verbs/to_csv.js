"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.to_csv = void 0;
const csv_1 = require("../format/csv");
function run(step) {
    if (step.schemaOnly) {
        step.output.done();
        return;
    }
    step.input.callback((result) => {
        const out = [];
        for (const line of (0, csv_1.formatAsCsv)(result, {
            attrs: result.getEffectiveAttrs(),
            includeHeader: true
        })) {
            out.push(line);
        }
        const buffer = Buffer.from(out.join(''));
        step.output.put({ buffer });
        step.output.done();
    });
}
exports.to_csv = {
    run,
};
//# sourceMappingURL=to_csv.js.map