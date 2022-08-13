"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.one = void 0;
function run(step) {
    let count = 0;
    const limit = 1;
    let limitReached = false;
    function setLimitReached() {
        step.input.setBackpressureStop();
        limitReached = true;
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
exports.one = {
    run
};
//# sourceMappingURL=one.js.map