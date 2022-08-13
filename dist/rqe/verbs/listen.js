"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listen = void 0;
function run(step) {
    if (step.schemaOnly)
        return;
    const stream = step.queryRelated({ with: 'listener-stream' }).one().attr('listener-stream').sync();
    step.async();
    stream.sendTo(step.output);
}
exports.listen = {
    run
};
//# sourceMappingURL=listen.js.map