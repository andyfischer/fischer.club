"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = void 0;
const Query_1 = require("./Query");
const Debug_1 = require("./Debug");
let _nextTraceId = 1;
class Trace {
    constructor() {
        this.log = [];
        this.stack = [];
        this.id = _nextTraceId;
        _nextTraceId++;
    }
    event(evt, params) {
        let data = (0, Query_1.toQuery)(evt);
        if (params)
            data = data.injectParameters(params);
        this.log.push({ t: 'event', data });
    }
    open(evt, params) {
        let data = (0, Query_1.toQuery)(evt);
        if (params)
            data = data.injectParameters(params);
        this.stack.push(data);
        this.log.push({ t: 'open', data });
    }
    close(evt, params) {
        let data = (0, Query_1.toQuery)(evt);
        if (params)
            data = data.injectParameters(params);
        this.stack.pop();
        this.log.push({ t: 'close', data });
    }
    str() {
        let out = [];
        let indentLevel = 0;
        function printIndent() {
            for (let i = 0; i < indentLevel; i++)
                out.push('  ');
        }
        for (const event of this.log) {
            switch (event.t) {
                case 'event':
                    printIndent();
                    out.push((0, Debug_1.toStructuredString)(event.data));
                    break;
                case 'open':
                    printIndent();
                    out.push((0, Debug_1.toStructuredString)(event.data) + ' {');
                    indentLevel++;
                    break;
                case 'close':
                    indentLevel--;
                    if (indentLevel < 0)
                        indentLevel = 0;
                    printIndent();
                    out.push('}');
                    break;
            }
            out.push('\n');
        }
        return out.join('');
    }
}
exports.Trace = Trace;
//# sourceMappingURL=Trace.js.map