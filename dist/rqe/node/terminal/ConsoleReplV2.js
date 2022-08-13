"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConsoleRepl = void 0;
const Repl = __importStar(require("repl"));
const Path = __importStar(require("path"));
const os = __importStar(require("os"));
const ConsoleFormatter_1 = require("../../format/ConsoleFormatter");
const ProcessExit_1 = require("../ProcessExit");
function startConsoleRepl(graph, opts = {}) {
    let enableConsoleOverwrite = true;
    let repl;
    let prompt = opts.prompt || 'rqe~ ';
    let consoleLog = console.log;
    const formatter = new ConsoleFormatter_1.ConsoleFormatter({
        log: consoleLog,
        prompt,
        printPrompt: () => repl.displayPrompt(),
        setPrompt: (s) => repl.setPrompt(s),
    });
    if (enableConsoleOverwrite) {
        console.log = (...args) => {
            formatter.preemptiveLog.apply(formatter, args);
        };
    }
    repl = Repl.start({
        prompt,
        eval: line => {
            if (!line || line.trim() === '') {
                formatter.touch();
                return;
            }
            const stream = graph.query(line, {});
            const task = formatter.newTask();
            stream.sendTo(task.incoming);
        },
    });
    try {
        repl.setupHistory(Path.join(os.homedir(), '.rqe_history'), () => { });
    }
    catch (e) { }
    repl.on('exit', () => {
        (0, ProcessExit_1.gracefulExit)(0);
    });
    return repl;
}
exports.startConsoleRepl = startConsoleRepl;
//# sourceMappingURL=ConsoleReplV2.js.map