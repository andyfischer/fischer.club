
import { Stream, StreamEvent } from '../Stream'
import { recordUnhandledException } from '../FailureTracking'

export function tee(input: Stream, count: number): Stream[] {
    let outputs = [];
    for (let i=0; i < count; i++)
        outputs.push(new Stream());

    input.sendTo({
        receive(msg) {
            for (const out of outputs) {
                try {
                    out.receive(msg);
                } catch (e) {
                    recordUnhandledException(e);
                }
            }
        }
    });

    return outputs;
}

export function joinStreams(count: number, output: Stream) {

    const receivers: Stream[] = [];
    let unfinishedCount = count;

    for (let i=0; i < count; i++) {
        receivers.push(Stream.newStreamToReceiver({
            receive(data: StreamEvent) {

                if (data.t === 'done') {
                    if (unfinishedCount === 0)
                        throw new Error("joinStreams got too many 'done' messages");

                    unfinishedCount--;

                    if (unfinishedCount !== 0)
                        return;
                }

                output.receive(data);
            }
        }))
    }

    return receivers;
}
