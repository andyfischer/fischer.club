
import { Stream } from '../Stream'
import { Step } from '../Step'

function run(step: Step) {
    if (step.schemaOnly)
        return;

    const stream = step.queryRelated({ with: 'listener-stream' }).one().attr('listener-stream').sync();

    step.async();
    stream.sendTo(step.output);
}

export const listen = {
    run
}
