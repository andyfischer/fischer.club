"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMetadataForGraph = exports.getMetadataForGraph = exports.getObjectMetadata = exports.setObjectMetadata = exports.javascriptQuickMountIntoGraph = exports.quickMountJavascriptFunction = void 0;
function getDecl(func) {
    if (typeof func !== 'function')
        throw new Error("expected a function: " + func);
    const match = new RegExp('(?:' + func.name + '\\s*|^)\\s*\\((.*?)\\)')
        .exec(func.toString().replace(/\n/g, ''));
    const argNames = match[1].replace(/\/\*.*?\*\//g, '').replace(/ /g, '').split(',');
    return {
        name: func.name,
        argNames,
    };
}
function quickMountJavascriptFunction(func) {
    const decl = getDecl(func);
    const name = decl.name || `anon`;
    const attrs = {};
    attrs[name] = {};
    for (const argName of decl.argNames) {
        attrs[argName] = {};
    }
    function run(step) {
        const argValues = decl.argNames.map(name => step.get(name));
        const output = func.apply(null, argValues);
        if (output && output.then) {
            step.async();
            return output.then(result => {
                step.put({ [name]: result });
                step.done();
            });
        }
        else {
            step.put({ [name]: output });
        }
    }
    return {
        name: `quick_mount_${name}`,
        attrs,
        run,
    };
}
exports.quickMountJavascriptFunction = quickMountJavascriptFunction;
function javascriptQuickMountIntoGraph(graph, func) {
    const existing = getMetadataForGraph(graph, func, 'jsQuickMount');
    if (existing)
        return existing;
    const module = graph.mount([quickMountJavascriptFunction(func)]);
    if (module.points.length !== 1)
        throw new Error('javascriptQuickMountIntoGraph internal error: got more than one table');
    const point = module.points[0];
    setMetadataForGraph(graph, func, 'jsQuickMount', point);
    return point;
}
exports.javascriptQuickMountIntoGraph = javascriptQuickMountIntoGraph;
function setObjectMetadata(obj, field, value) {
    obj['.rqe'] = obj['.rqe'] || new Map();
    const arqeData = obj['.rqe'];
    arqeData.set(field, value);
}
exports.setObjectMetadata = setObjectMetadata;
function getObjectMetadata(obj, field) {
    if (!obj['.rqe'])
        return null;
    const arqeData = obj['.rqe'];
    return arqeData.get(field);
}
exports.getObjectMetadata = getObjectMetadata;
function getMetadataForGraph(graph, obj, field) {
    const forGraph = getObjectMetadata(obj, `graph-${graph.graphId}`);
    if (!forGraph)
        return null;
    return forGraph.get(field);
}
exports.getMetadataForGraph = getMetadataForGraph;
function setMetadataForGraph(graph, obj, field, value) {
    let forGraph = getObjectMetadata(obj, `graph-${graph.graphId}`);
    if (!forGraph) {
        forGraph = new Map();
        setObjectMetadata(obj, `graph-${graph.graphId}`, forGraph);
    }
    forGraph.set(field, value);
}
exports.setMetadataForGraph = setMetadataForGraph;
//# sourceMappingURL=QuickMount.js.map