"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetupFromModule = exports.getSetupFromModule = void 0;
function getSetupFromModule(moduleContents) {
    const points = [];
    if (moduleContents.mountTables) {
        throw new Error('mountTables no longer supported');
    }
    for (const [name, value] of Object.entries(moduleContents)) {
        if (value && value.t === 'tableBindParams') {
            const bind = {
                ...value,
                name,
            };
            points.push(bind);
        }
    }
    return points;
}
exports.getSetupFromModule = getSetupFromModule;
function runSetupFromModule(graph, moduleContents) {
    const points = getSetupFromModule(moduleContents);
    const module = graph.mount(points);
    return module;
}
exports.runSetupFromModule = runSetupFromModule;
//# sourceMappingURL=loadNodeModule.js.map