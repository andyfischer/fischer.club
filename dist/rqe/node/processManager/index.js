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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWithCli = exports.launchProcessMonitor = void 0;
const ChildProcess = __importStar(require("child_process"));
const consoleRepl_1 = require("../consoleRepl");
const globalGraph_1 = require("../../globalGraph");
const Table_1 = require("../../Table");
const ansi_1 = require("../3rdparty/ansi");
const ansi_regex_1 = __importDefault(require("../3rdparty/ansi-regex"));
function outputToLines(msg) {
    return msg
        .toString()
        .split('\n')
        .filter((line) => line !== '');
}
const liveProcessTables = new Table_1.Table({});
let hasSetupExitListener = false;
function setupExitListener() {
    if (hasSetupExitListener)
        return;
    process.on('exit', () => {
        for (const table of liveProcessTables.list()) {
            for (const { processWrapper } of table.list()) {
                try {
                    if (processWrapper)
                        processWrapper.stop();
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    });
    hasSetupExitListener = true;
}
class ProcessWrapper {
    restart(command, args, options) {
        if (this.proc)
            this.stop();
        this.launchOptions = options;
        this.proc = ChildProcess.spawn(command, args, {
            cwd: options.cwd,
            stdio: 'pipe',
        });
        const printOutput = (data) => {
            const lines = outputToLines(data);
            for (let line of lines) {
                this.log(`[${options.logPrefix}] ${line}`);
            }
        };
        this.proc.stdout.on('data', printOutput);
        this.proc.stderr.on('data', printOutput);
        this.log(`[${this.launchOptions.logPrefix} started: ${command} ${args.join(' ')}]`);
    }
    log(s) {
        s = s.replace((0, ansi_regex_1.default)(), '');
        if (this.launchOptions.logColor) {
            const cursor = (0, ansi_1.ansi)(process.stdout, {});
            cursor.hex(this.launchOptions.logColor);
            console.log(s);
            cursor.reset();
        }
        else {
            console.log(s);
        }
    }
    stop() {
        this.log(`[${this.launchOptions.logPrefix} stopped]`);
        this.proc.kill();
        this.proc = null;
    }
}
function launchProcessMonitor(graph) {
    graph = graph || (0, globalGraph_1.getGraph)();
    const processes = graph.newTable({
        name: 'processes',
        attrs: {
            name: { required: true },
            cwd: {},
            color: {},
            id: { index: true, generate: { method: 'random' } },
            shell: { required: true },
        },
        mount: { namespace: 'processes' },
    });
    processes.addChangeListener(change => {
        let existing = liveProcesses.one({ def_id: change.item.id });
        if (change.verb === 'delete') {
            if (existing)
                existing.processWrapper.stop();
            liveProcesses.delete(existing);
            return;
        }
        const parsedArgs = change.item.shell.split(' ');
        const command = parsedArgs[0];
        const args = parsedArgs.slice(1);
        const cwd = change.item.cwd;
        if (!existing) {
            existing = liveProcesses.put({
                def_id: change.item.id,
                processWrapper: new ProcessWrapper()
            });
        }
        existing.processWrapper.restart(command, args, {
            logPrefix: change.item.name,
            logColor: change.item.color,
            cwd,
        });
    });
    const liveProcesses = graph.newTable({
        name: 'liveProcesses',
        attrs: {
            def_id: {
                index: true,
                foreignKey: {
                    table: processes,
                    foreignAttr: 'id',
                }
            }
        }
    });
    liveProcessTables.put(liveProcesses);
    setupExitListener();
    return { processes, liveProcesses };
}
exports.launchProcessMonitor = launchProcessMonitor;
function startWithCli() {
    const graph = (0, globalGraph_1.getGraph)();
    (0, consoleRepl_1.startConsoleRepl)(graph);
}
exports.startWithCli = startWithCli;
if (require.main === module) {
    startWithCli();
}
//# sourceMappingURL=index.js.map