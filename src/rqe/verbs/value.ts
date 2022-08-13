
import { Step } from '../Step'

function run(step: Step) {
    const { output } = step;

    output.put(step.args());
    output.done();
}

export const value = {
    run,
}
