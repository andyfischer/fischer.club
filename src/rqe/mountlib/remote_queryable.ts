
import { MountPointSpec } from '../MountPoint'
import { parseTableDecl } from '../parser/parseTableDecl'
import { Queryable } from '../Graph'
import { Step } from '../Step'
import { QueryModifier } from '../Query'

interface Options {
    graph: Queryable
    queryModifier?: QueryModifier
}

export function forwardToRemote(step: Step, options: Options) {
    let tuple = step.tuple;

    // console.log('remote queryable is sending: ', tuple.toQueryString())

    if (options.queryModifier)
        tuple = tuple.getRelated(options.queryModifier);

    // todo - propogate resource tags?

    const output = options.graph.query(tuple, null);
    output.sendTo(step.output);
    step.streaming();
}

export function setupRemoteQueryable(decl: string, options: Options): MountPointSpec {
    const mountSpec = parseTableDecl(decl);
    const graph = options.graph;

    if (!graph)
        throw new Error('missing: graph');

    mountSpec.run = (step: Step) => {
        forwardToRemote(step, options);
    }

    return mountSpec;
}
