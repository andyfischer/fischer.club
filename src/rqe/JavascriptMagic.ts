
import { Step } from './Step'
import { MountPointSpec } from './MountPoint'
import { parseTableDecl } from './parser/parseTableDecl'

const FunctionRegex = /.*?\((.*?)\)/

export function getFunctionParameterNames(func: Function) {
    const str = func.toString();

    const match = FunctionRegex.exec(str);

    let argsStr;

    if (match) {
        argsStr = match[1];
    } else {
        argsStr = str.slice(0, str.indexOf('=>')).trim();
    }

    const args = argsStr.split(',')
        .map(arg => arg.trim())
        .filter(arg => arg !== '');

    return args;
}

export function setupFunctionWithJavascriptMagic(decl: string, func: Function): MountPointSpec {
    const mount = parseTableDecl(decl);
    const args = getFunctionParameterNames(func);
    mount.run = (step: Step) => {
        const argValues = args.map(argName => {

            // Special names
            if (argName === 'task')
                return step;
            if (argName === 'step')
                return step;
            if (argName === 'query')
                return (q, p) => step.query(q, p);
            if (argName === 'item')
                return step.args();
            if (argName === 'graph')
                return step.graph;

            return step.getOptional(argName, null)
        });
        return func.apply(null, argValues);
    }

    return mount;
}
