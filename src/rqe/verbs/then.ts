
import { Stream } from '../Stream'
import { Step } from '../Step'
import { c_done } from '../Enums'
import { joinStreams } from '../utils/streamUtil'

function run(step: Step) {
    const receivers = joinStreams(2, step.output);

    let hasLaunchedSearch = false;

    const remainingTuple = step.tuple.shallowCopy();
    remainingTuple.deleteAttr('then');

    const searchInput = Stream.newEmptyStream();
    const searchOutput = Stream.newStreamToReceiver(receivers[1]);

    step.input.sendTo({
        receive(msg) {
            receivers[0].receive(msg);

            if (msg.t === c_done && !hasLaunchedSearch) {
                hasLaunchedSearch = true;
                step.findAndCallMountPoint(remainingTuple, searchInput, searchOutput);
            }
        }
    });
}

export const then = {
    run,
}
