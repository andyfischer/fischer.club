
import { Step } from '../Step'
import { runQueryWithProvider } from '../Runtime'

function run(step: Step) {
    const { tuple, input, output } = step;
    const { provider_id, query } = step.args();

    if (!query) {
        throw new Error("missing 'query'");
    }

    runQueryWithProvider(step.graph, provider_id, query, input)
    .sendTo(output);
}

export const run_query_with_provider = {
    run
}
