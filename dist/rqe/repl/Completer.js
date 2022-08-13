"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletions = void 0;
const _list_1 = require("../verbs/_list");
function getCompletions(graph, line) {
    if (!line || line === "")
        return [];
    let lastWordDivider = -1;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === ' ' || c === '|')
            lastWordDivider = i;
    }
    const priorLine = line.substring(0, lastWordDivider + 1);
    const lastWord = line.substring(lastWordDivider + 1);
    const found = new Map();
    for (const verb of (0, _list_1.listEveryVerb)()) {
        if (verb.startsWith(lastWord))
            found.set(verb, true);
    }
    if (graph.everyMountPoint) {
        for (const table of graph.everyMountPoint()) {
            for (const attr of Object.keys(table.attrs)) {
                if (attr.startsWith(lastWord))
                    found.set(attr, true);
            }
        }
    }
    const completions = [];
    for (const key of found.keys())
        completions.push(priorLine + key);
    return completions;
}
exports.getCompletions = getCompletions;
//# sourceMappingURL=Completer.js.map