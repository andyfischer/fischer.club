"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.then = void 0;
const Stream_1 = require("../Stream");
const Enums_1 = require("../Enums");
const streamUtil_1 = require("../utils/streamUtil");
function run(step) {
    const receivers = (0, streamUtil_1.joinStreams)(2, step.output);
    let hasLaunchedSearch = false;
    const remainingTuple = step.tuple.shallowCopy();
    remainingTuple.deleteAttr('then');
    const searchInput = Stream_1.Stream.newEmptyStream();
    const searchOutput = Stream_1.Stream.newStreamToReceiver(receivers[1]);
    step.input.sendTo({
        receive(msg) {
            receivers[0].receive(msg);
            if (msg.t === Enums_1.c_done && !hasLaunchedSearch) {
                hasLaunchedSearch = true;
                step.findAndCallMountPoint(remainingTuple, searchInput, searchOutput);
            }
        }
    });
}
exports.then = {
    run,
};
//# sourceMappingURL=then.js.map