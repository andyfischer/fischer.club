
import { Step } from '../Step'
import { Item } from '../Item'

function run(step: Step) {
    const { tuple, input, output } = step;
    const args = step.argsQuery().toItemValue();

    input.transform(output, (item: Item) => {
        return {
            ...item,
            ...args
        }
    });
}

export const _with = {
    run,
}
