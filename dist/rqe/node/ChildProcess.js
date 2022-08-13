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
exports.procs = exports.spawn = exports.active_procs = void 0;
const child_process = __importStar(require("child_process"));
const Table_1 = require("../Table");
const ProcessExit_1 = require("./ProcessExit");
const globalGraph_1 = require("../globalGraph");
exports.active_procs = (0, globalGraph_1.newTable)({
    attrs: {
        active_procs: {},
        cmd: {},
        args: {},
        id: { generate: { method: 'increment', prefix: 'proc-' } },
        proc: {},
    },
    funcs: [
        'active_procs id ->'
    ]
});
let _hasRegisteredOnExitCallback = false;
function spawn(graph, cmd, args, options, moreOptions) {
    if (!_hasRegisteredOnExitCallback) {
        (0, ProcessExit_1.getExitCallbacksTable)().put({
            callback: () => {
                for (const { id, proc } of exports.active_procs.scan()) {
                    (0, globalGraph_1.log)('subprocess', 'killing leftover process: ' + id);
                    proc.kill();
                }
            }
        });
        _hasRegisteredOnExitCallback = true;
    }
    const proc = child_process.spawn(cmd, args, options);
    const { id } = exports.active_procs.put({ cmd, args, proc });
    proc.on('spawn', () => {
        graph.logging.put('subprocess', `started child process (${id}): ${cmd} ${args.join(' ')}`);
    });
    proc.on('exit', () => {
        graph.logging.put('subprocess', `child process exited (${id}): ${cmd} ${args.join(' ')}`);
        exports.active_procs.delete({ id });
    });
    proc['id'] = id;
    return proc;
}
exports.spawn = spawn;
exports.procs = new Table_1.Table({
    attrs: {
        proc: {}
    }
});
//# sourceMappingURL=ChildProcess.js.map