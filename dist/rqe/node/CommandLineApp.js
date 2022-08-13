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
exports.runCommandLineProcess = exports.setupCliGraph = void 0;
const Fs = __importStar(require("fs"));
const kdl = __importStar(require("kdljs"));
const consoleRepl_1 = require("./consoleRepl");
const requireAndWatch_1 = require("./requireAndWatch");
const loadNearbyModules_1 = require("./loadNearbyModules");
const loadNodeModule_1 = require("./loadNodeModule");
const SubprocessMount_1 = require("./SubprocessMount");
const globalGraph_1 = require("../globalGraph");
const ProcessExit_1 = require("./ProcessExit");
const parseCommandLineArgs_1 = require("./parseCommandLineArgs");
const ConsoleFormatter_1 = require("../format/ConsoleFormatter");
require("../tools/common/InterceptConsoleLog");
function runFile(graph, filename) {
    const contents = Fs.readFileSync(filename, 'utf8');
    throw new Error("parseFile not implemented");
}
function setupCliGraph(options) {
    const graph = (0, globalGraph_1.getGraph)();
    require('./lib/fs');
    require('./lib/buffer');
    require('./lib/git');
    require('./lib/shell');
    require('./lib/OptionalNodeInstall');
    require('./lib/typescript');
    require('./lib/ScratchDirs');
    graph.enableLogging();
    for (const category of options.enableLoggingCategories || [])
        graph.logging.enable(category);
    graph.setupBrowse();
    if (options.loadFromCurrentDirectory)
        (0, loadNearbyModules_1.loadFromCurrentDirectory)(graph);
    if (options.loadUserSetupDirectory)
        (0, loadNearbyModules_1.loadFromUserSetupDirectories)(graph);
    if (options.setupGraph)
        options.setupGraph(graph);
    for (const filename of (options.loadFiles || [])) {
        (0, requireAndWatch_1.requireAndWatch)(graph, filename);
    }
    for (const module of (options.loadModules || [])) {
        (0, loadNodeModule_1.runSetupFromModule)(graph, module);
    }
    (0, SubprocessMount_1.setupSubprocessTable)(graph);
    for (const subprocessCommand of (options.loadSubprocesses || [])) {
        const subprocess = new SubprocessMount_1.SubprocessMount(graph, subprocessCommand);
        subprocess.start();
    }
    return graph;
}
exports.setupCliGraph = setupCliGraph;
function maybeLoadConfigFile(filename) {
    let contents;
    try {
        contents = Fs.readFileSync(filename, "utf8");
    }
    catch (err) {
        return null;
    }
    const parsed = kdl.parse(contents);
    if (parsed.errors.length > 0)
        throw new Error("config parsing error: " + parsed.errors);
    return parsed.output;
}
function loadNearbyConfigFile(options) {
    const configs = maybeLoadConfigFile('.rqe.kdl');
    if (!configs)
        return null;
    for (const node of configs) {
        if (node.name === 'load') {
            for (const loadNode of node.children) {
                if (loadNode.name === 'subprocess') {
                    options.loadSubprocesses = options.loadSubprocesses || [];
                    const command = loadNode.values[0];
                    const cmd = command.split(' ')[0];
                    const args = command.split(' ').slice(1);
                    options.loadSubprocesses.push({
                        cmd,
                        args,
                        options: {}
                    });
                }
            }
        }
    }
}
function optionsWithCommandLine(options, args) {
    for (const flag of args.flags) {
        if (flag.name === 'subprocess') {
            options.loadSubprocesses = options.loadSubprocesses || [];
            options.loadSubprocesses.push((0, SubprocessMount_1.toShellCommand)(flag.value));
        }
        if (flag.name === 'enable-logging') {
            options.enableLoggingCategories = options.enableLoggingCategories || [];
            options.enableLoggingCategories.push(flag.value);
        }
        if (flag.name === 'stdin') {
            options.runFromStdin = true;
        }
    }
    return options;
}
function optionsWithDefaults(options) {
    if (options.runFromStdin && options.startRepl === undefined)
        options.startRepl = false;
    if (options.startRepl === undefined)
        options.startRepl = true;
    return options;
}
function runFromStdin(graph) {
    const formatter = new ConsoleFormatter_1.ConsoleFormatter({ graph });
    process.stdin.on('data', chunk => {
        let query = chunk.toString();
        if (query[query.length - 1] === '\n')
            query = query.slice(0, query.length - 1);
        graph.query(query).sendTo(formatter.newTask().incoming);
    });
}
function setTerminalTitle(title) {
    process.stdout.write(String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7));
}
async function runCommandLineProcess(options = {}) {
    var _a;
    require('source-map-support').install();
    try {
        (0, ProcessExit_1.overrideProcessExit)();
        const parsedArgs = (0, parseCommandLineArgs_1.parseCommandLineArgs)(process.argv.slice(2).join(' '));
        options = optionsWithCommandLine(options, parsedArgs);
        options = optionsWithDefaults(options);
        const graph = setupCliGraph(options);
        if ((_a = options.terminal) === null || _a === void 0 ? void 0 : _a.title) {
            setTerminalTitle(options.terminal.title);
        }
        if (options.onReady) {
            await options.onReady(graph);
        }
        if (options.runWhenReady) {
            const formatter = new ConsoleFormatter_1.ConsoleFormatter({ graph });
            for (const query of options.runWhenReady) {
                graph.query(query).sendTo(formatter.newTask().incoming);
            }
        }
        if (options.startRepl) {
            const replOptions = (options.startRepl && typeof options.startRepl === 'object') ? options.startRepl : {};
            (0, consoleRepl_1.startConsoleRepl)(graph, replOptions);
        }
        if (options.runFromStdin) {
            runFromStdin(graph);
        }
        return graph;
    }
    catch (err) {
        process.exitCode = -1;
        console.error(err.stack || err);
    }
}
exports.runCommandLineProcess = runCommandLineProcess;
if (require.main === module) {
    runCommandLineProcess({
        standardCommandLineArgHandling: false
    });
}
//# sourceMappingURL=CommandLineApp.js.map