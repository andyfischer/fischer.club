
import { Stream } from '../Stream'
import { Step } from '../Step'
import { joinStreams } from '../utils/streamUtil'

function run(step: Step) {

    const searchTuple = step.argsQuery();

    const receivers = joinStreams(2, step.output);
    const inputReceiver = receivers[0];
    step.input.sendTo(inputReceiver);

    const searchReceiver = receivers[1];

    step.findAndCallMountPoint(searchTuple, Stream.newEmptyStream(), searchReceiver);
}

export const add = {
    run
}
