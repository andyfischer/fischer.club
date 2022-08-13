"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = void 0;
const Enums_1 = require("../Enums");
function run(step) {
    step.input.sendTo({
        receive(msg) {
            switch (msg.t) {
                case Enums_1.c_item:
                    step.output.receive(msg);
                    if (!step.schemaOnly) {
                        const fixedAttrs = step.tuple.shallowCopy();
                        if (fixedAttrs.has('item'))
                            fixedAttrs.overwriteTag({ t: 'tag', attr: 'item', value: { t: 'item', item: msg.item } });
                        step.graph.query(fixedAttrs);
                    }
                    break;
                default:
                    step.output.receive(msg);
            }
        }
    });
}
exports.trace = {
    run,
};
//# sourceMappingURL=trace.js.map