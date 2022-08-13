
import { Step } from '../Step'

function run(step: Step) {
    const { tuple, input, output } = step;
    const args = step.argsQuery();

    if (step.schemaOnly) {
        output.put(args.toItemValue());
        output.done();
        return;
    }

    input.sendTo(output);
}

export const incoming = {
    run,
}
