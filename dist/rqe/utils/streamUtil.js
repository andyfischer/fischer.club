"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinStreams = exports.tee = void 0;
const Stream_1 = require("../Stream");
const FailureTracking_1 = require("../FailureTracking");
function tee(input, count) {
    let outputs = [];
    for (let i = 0; i < count; i++)
        outputs.push(new Stream_1.Stream());
    input.sendTo({
        receive(msg) {
            for (const out of outputs) {
                try {
                    out.receive(msg);
                }
                catch (e) {
                    (0, FailureTracking_1.recordUnhandledException)(e);
                }
            }
        }
    });
    return outputs;
}
exports.tee = tee;
function joinStreams(count, output) {
    const receivers = [];
    let unfinishedCount = count;
    for (let i = 0; i < count; i++) {
        receivers.push(Stream_1.Stream.newStreamToReceiver({
            receive(data) {
                if (data.t === 'done') {
                    if (unfinishedCount === 0)
                        throw new Error("joinStreams got too many 'done' messages");
                    unfinishedCount--;
                    if (unfinishedCount !== 0)
                        return;
                }
                output.receive(data);
            }
        }));
    }
    return receivers;
}
exports.joinStreams = joinStreams;
//# sourceMappingURL=streamUtil.js.map