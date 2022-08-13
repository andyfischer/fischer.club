"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = void 0;
const QueryTuple_1 = require("../QueryTuple");
const TaggedValue_1 = require("../TaggedValue");
const Stream_1 = require("../Stream");
function run(step) {
    const verbParams = step.argsQuery();
    if (verbParams.t !== 'queryTuple')
        throw new Error('internal error: step.argsQuery returned wrong data');
    step.input.streamingTransform(step.output, lhsItem => {
        const putStep = new QueryTuple_1.QueryTuple([{
                t: 'tag',
                attr: 'put!',
                value: new QueryTuple_1.QueryTuple([]),
            }]);
        for (const [attr, value] of Object.entries(lhsItem)) {
            putStep.addTag({ t: 'tag', attr, value: (0, TaggedValue_1.toTagged)(value) });
        }
        for (const tag of verbParams.tags) {
            putStep.addTag(tag);
        }
        const output = new Stream_1.Stream();
        step.findAndCallMountPoint(putStep, Stream_1.Stream.newEmptyStream(), output);
        return output;
    });
}
exports.put = {
    run
};
//# sourceMappingURL=put.js.map