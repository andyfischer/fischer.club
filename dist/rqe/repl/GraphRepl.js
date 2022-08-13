"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function trimEndline(str) {
    if (str.length > 0 && str[str.length - 1] === '\n')
        return str.slice(0, str.length - 1);
    return str;
}
class GraphRepl {
    constructor(graph, opts) {
        this.graph = graph;
        this.opts = opts;
    }
    async eval(line, onDone) {
        try {
            line = trimEndline(line);
            if (line === '') {
                onDone();
                return;
            }
            const output = this.graph.query(line);
            const task = this.formatter.newTask();
            output.sendTo(task.incoming);
        }
        catch (e) {
            console.log('Unhandled exception in GraphRepl.eval: ', e.stack || e);
        }
    }
}
exports.default = GraphRepl;
//# sourceMappingURL=GraphRepl.js.map