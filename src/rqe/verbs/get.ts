
import { Step } from '../Step'
import { callMountPoint, findAndCallMountPoint } from '../Runtime'

function run(step: Step) {
    if (step.plannedStep.staticMatch?.t === 'found') {
        return callMountPoint(step, step.plannedStep.staticMatch.match, step.afterVerb, step.input, step.output);
    }

    // Fallback, do a dynamic search. There seems to be some issues with static matching.
    return findAndCallMountPoint(step, step.afterVerb, step.input, step.output);
}

export const get = {
    run,
    name: 'get',
}
