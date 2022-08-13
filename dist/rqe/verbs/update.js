"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const QueryTuple_1 = require("../QueryTuple");
const Stream_1 = require("../Stream");
const TaggedValue_1 = require("../TaggedValue");
function run(step) {
    const verbParams = step.tuple.shallowCopy();
    verbParams.deleteAttr('update');
    step.input.streamingTransform(step.output, lhsItem => {
        const updateDetails = new QueryTuple_1.QueryTuple([]);
        const updateStep = new QueryTuple_1.QueryTuple([{
                t: 'tag',
                attr: 'update!',
                value: updateDetails,
            }]);
        for (const [attr, value] of Object.entries(lhsItem)) {
            updateStep.addTag({ t: 'tag', attr, value: (0, TaggedValue_1.toTagged)(value) });
        }
        for (const tag of verbParams.tags) {
            updateDetails.addTag({ t: 'tag', attr: tag.attr, value: tag.value });
        }
        const output = new Stream_1.Stream();
        step.findAndCallMountPoint(updateStep, Stream_1.Stream.newEmptyStream(), output);
        return output;
    });
}
exports.update = {
    run
};
//# sourceMappingURL=update.js.map