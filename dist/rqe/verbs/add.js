"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = void 0;
const Stream_1 = require("../Stream");
const streamUtil_1 = require("../utils/streamUtil");
function run(step) {
    const searchTuple = step.argsQuery();
    const receivers = (0, streamUtil_1.joinStreams)(2, step.output);
    const inputReceiver = receivers[0];
    step.input.sendTo(inputReceiver);
    const searchReceiver = receivers[1];
    step.findAndCallMountPoint(searchTuple, Stream_1.Stream.newEmptyStream(), searchReceiver);
}
exports.add = {
    run
};
//# sourceMappingURL=add.js.map