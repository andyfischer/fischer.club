"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSubprocessTable = exports.toShellCommand = exports.SubprocessMount = void 0;
const IDSource_1 = require("../utils/IDSource");
const Stream_1 = require("../Stream");
const Query_1 = require("../Query");
const globalGraph_1 = require("../globalGraph");
const ChildProcess_1 = require("./ChildProcess");
const subprocess_mounts = (0, globalGraph_1.newTable)({
    attrs: {
        subprocess_id: { generate: { method: 'increment', prefix: 'subprocess-' } },
        subprocess: {},
    }
});
(0, globalGraph_1.func)("subprocess restart!", (subprocess) => {
    subprocess.restart();
});
(0, globalGraph_1.func)("subprocess kill!", (subprocess) => {
    subprocess.kill();
});
class SubprocessMount {
    constructor(graph, command) {
        this.streamIds = new IDSource_1.IDSourceNumber();
        this.modules = new Map();
        this.outputStreams = new Map();
        this.graph = graph;
        this.command = command;
        const { subprocess_id } = subprocess_mounts.put({ subprocess: this });
        this.subprocess_id = subprocess_id;
    }
    start() {
        if (this.proc)
            throw new Error("already have .proc");
        const proc = (0, ChildProcess_1.spawn)(this.graph, this.command.cmd, this.command.args, {
            ...this.command.options,
            env: {
                ...process.env,
                RQE_SUBPROCESS: 'true',
            },
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        }, {});
        proc.stdout.on('data', msg => {
            msg = msg.toString();
            if (msg.endsWith('\n'))
                msg = msg.substring(0, msg.length - 1);
            console.log(`[subprocess] ` + msg);
        });
        proc.stderr.on('data', msg => {
            msg = msg.toString();
            if (msg.endsWith('\n'))
                msg = msg.substring(0, msg.length - 1);
            console.error(`[subprocess] ` + msg);
        });
        proc.on('message', msg => {
            if (typeof msg === 'string')
                msg = JSON.parse(msg);
            this.handle(msg);
        });
        proc.on('exit', () => {
            console.log(`process has exited: ${this.command.cmd} ${this.command.args}`);
            this.closeEverything();
        });
        this.proc = proc;
        const { provider_id } = this.graph.providers().put({
            runQuery: (query, input) => this.runQueryInSubprocess(query, input),
        });
        this.provider_id = provider_id;
    }
    kill() {
        this.closeEverything();
        if (this.proc)
            this.proc.kill();
        this.graph.providers().delete({ provider_id: this.provider_id });
        this.proc = null;
        this.provider_id = null;
    }
    restart() {
        this.kill();
        this.start();
    }
    connectInputStream(input) {
        return null;
    }
    connectOutputStream() {
        const outputStream = new Stream_1.Stream();
        const outputStreamId = this.streamIds.take();
        this.outputStreams.set(outputStreamId, outputStream);
        return { outputStream, outputStreamId };
    }
    runQueryInSubprocess(query, input) {
        const { outputStream, outputStreamId } = this.connectOutputStream();
        this.proc.send({
            t: 'query',
            query,
            input: this.connectInputStream(input),
            output: outputStreamId,
        });
        return outputStream;
    }
    handle(msg) {
        console.log('handle message from subprocess', msg);
        switch (msg.t) {
            case 'updateModule': {
                const { pointSpecs, id } = msg;
                if (!this.modules.has(id))
                    this.modules.set(id, this.graph.createEmptyModule());
                const module = this.modules.get(id);
                for (const spec of pointSpecs) {
                    spec.providerId = this.provider_id;
                    spec.run = (step) => {
                        step.async();
                        const outputStream = this.runQueryInSubprocess(new Query_1.Query([
                            step.tuple
                        ]), step.input);
                        outputStream.sendTo(step.output);
                    };
                }
                module.redefine(pointSpecs);
                break;
            }
            case 'output': {
                const stream = this.outputStreams.get(msg.streamId);
                stream.receive(msg.msg);
                break;
            }
            default:
                console.warn('unrecognized message from subprocess: ', msg.t);
        }
    }
    closeEverything() {
        for (const module of this.modules.values()) {
            module.clear();
        }
        for (const stream of this.outputStreams.values()) {
            stream.sendDoneIfNeeded();
        }
        this.outputStreams.clear();
    }
}
exports.SubprocessMount = SubprocessMount;
function toShellCommand(s) {
    const args = s.split(' ');
    return {
        cmd: args[0],
        args: args.slice(1),
        options: {},
    };
}
exports.toShellCommand = toShellCommand;
function setupSubprocessTable(graph) {
    const loadSubprocess = graph.newTable({
        attrs: {
            id: { generate: { method: 'increment' } },
            load_subprocess: {},
            cmd: {},
        },
        funcs: [
            'load_subprocess cmd ->'
        ]
    });
    const loadToSubprocess = graph.newTable({
        attrs: {
            load_id: {},
            subprocess_id: {},
        },
        funcs: [
            'load_id ->',
            'subprocess_id ->',
        ]
    });
    loadSubprocess.addChangeListener(change => {
        console.log(change);
        if (change.verb === 'put') {
            const { id, cmd } = change.item;
            const fullCommand = toShellCommand(cmd);
            console.log('starting subprocess', fullCommand);
            const mount = new SubprocessMount(graph, fullCommand);
            mount.start();
            loadToSubprocess.put({ load_id: id, subprocess_id: mount.subprocess_id });
        }
        else if (change.verb === 'delete') {
            const { id } = change.item;
            const { subprocess_id } = loadToSubprocess.one({ load_id: id });
            const { subprocess } = subprocess_mounts.one({ subprocess_mounts });
            subprocess.kill();
        }
    });
}
exports.setupSubprocessTable = setupSubprocessTable;
//# sourceMappingURL=SubprocessMount.js.map