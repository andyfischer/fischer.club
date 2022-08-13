"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listen = void 0;
const FailureTracking_1 = require("../FailureTracking");
function run(step) {
    if (step.schemaOnly)
        return;
    const listener_id = step.get('listener-id');
    for (const { close_callback } of step.graph.builtins.listener_close_signal().where({ listener_id })) {
        try {
            close_callback();
        }
        catch (e) {
            (0, FailureTracking_1.recordUnhandledException)(e);
        }
    }
}
exports.listen = {
    run
};
//# sourceMappingURL=close_listener.js.map