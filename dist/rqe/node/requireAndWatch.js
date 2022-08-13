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
exports.loadWatchedTableGlob = exports.loadWatchedTableDir = exports.requireAndWatch = void 0;
const Path = __importStar(require("path"));
const Fs = __importStar(require("fs"));
const Glob = __importStar(require("glob"));
const Debounce_1 = __importDefault(require("../utils/Debounce"));
const loadNodeModule_1 = require("./loadNodeModule");
const loadedModules = new Map();
function requireAndWatch(graph, filename) {
    filename = Path.resolve(filename);
    if (loadedModules.has(filename)) {
        return;
    }
    const module = graph.createEmptyModule();
    let lastMtime;
    function reloadNow() {
        const mtime = Fs.statSync(filename).mtime.valueOf();
        if (mtime === lastMtime)
            return;
        lastMtime = mtime;
        const resolvedFilename = require.resolve(filename);
        const existingModule = require.cache[resolvedFilename];
        delete require.cache[resolvedFilename];
        try {
            const contents = require(filename);
            const setup = (0, loadNodeModule_1.getSetupFromModule)(contents);
            module.redefine(setup);
            if (existingModule) {
                console.log(`reloaded: ${filename}`);
            }
        }
        catch (err) {
            console.log(`Failed to load module: ${filename}\n${err.stack || err}`);
            require.cache[resolvedFilename] = existingModule;
        }
    }
    loadedModules.set(filename, true);
    reloadNow();
    const reload = new Debounce_1.default(reloadNow, 250);
    Fs.watch(filename, () => reload.post());
}
exports.requireAndWatch = requireAndWatch;
function loadWatchedTableDir(graph, dir) {
    const files = Glob.sync(Path.join(dir, '**/*.js'));
    for (const file of files)
        requireAndWatch(graph, file);
}
exports.loadWatchedTableDir = loadWatchedTableDir;
function loadWatchedTableGlob(graph, pattern) {
    const files = Glob.sync(pattern);
    for (const file of files)
        requireAndWatch(graph, file);
}
exports.loadWatchedTableGlob = loadWatchedTableGlob;
//# sourceMappingURL=requireAndWatch.js.map