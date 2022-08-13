"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limit = void 0;
function run(step) {
    const limit = parseInt(step.get('count'));
    let count = 0;
    let limitReached = false;
    function setLimitReached() {
        step.input.setBackpressureStop();
        limitReached = true;
    }
    if (limit === 0) {
        setLimitReached();
        step.output.done();
        return;
    }
    step.input.sendTo({
        receive(data) {
            switch (data.t) {
                case 'done':
                    if (!limitReached)
                        step.output.done();
                    break;
                case 'item':
                    count++;
                    if (count > limit)
                        return;
                    step.output.receive(data);
                    if (count == limit) {
                        step.output.done();
                        setLimitReached();
                    }
                    break;
                default:
                    step.output.receive(data);
            }
        }
    });
}
exports.limit = {
    run,
};
//# sourceMappingURL=limit.js.map