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
exports.loadFromUserSetupDirectories = exports.loadFromCurrentDirectory = void 0;
const Glob = __importStar(require("glob"));
const Path = __importStar(require("path"));
const Fs = __importStar(require("fs"));
const requireAndWatch_1 = require("./requireAndWatch");
const Configs_1 = require("./Configs");
const kdl = __importStar(require("kdljs"));
if (Configs_1.EnableTsModules) {
    try {
        require('ts-node').register({});
    }
    catch (e) {
    }
}
let _moduleLogs = [];
function log(msg) {
    console.log(msg);
    _moduleLogs.push(msg);
}
function findNearbyPatternsFromConfig() {
    const nearbyPatterns = [];
    let contents;
    try {
        contents = Fs.readFileSync(".rqe.kdl", "utf8");
    }
    catch (err) {
        return;
    }
    const parsed = kdl.parse(contents);
    for (const node of parsed.output) {
        if (node.name === 'load') {
            for (const loadNode of node.children) {
                if (loadNode.name === 'pattern') {
                    for (const value of loadNode.values)
                        nearbyPatterns.push(value);
                }
            }
        }
    }
    return nearbyPatterns;
}
function defaultNearbyPatterns() {
    const nearbyPatterns = [
        'dist/node/tables/**/*.js',
        'dist/**/*.table.js',
        '*.table.js',
        'tables.js',
        '.tables.js',
        '.rqe.js',
        'dist/tables.js',
        '.rqe/**/*.js',
    ];
    if (Configs_1.EnableTsModules) {
        nearbyPatterns.push('tables.ts');
        nearbyPatterns.push('src/tables.ts');
        nearbyPatterns.push('.tables.ts');
        nearbyPatterns.push('*.table.ts');
        nearbyPatterns.push('.rqe.ts');
        nearbyPatterns.push('.rqe/**/*.ts');
    }
    return nearbyPatterns;
}
function loadDirectory(graph, dir, dirNote) {
    const nearbyPatterns = findNearbyPatternsFromConfig() || defaultNearbyPatterns();
    let files = [];
    for (const pattern of nearbyPatterns) {
        files = files.concat(Glob.sync(Path.join(dir, pattern), {
            ignore: ['**/node_modules/**']
        }));
    }
    for (const filename of files) {
        if (filename.indexOf("__tests__") !== -1)
            continue;
        let note = dirNote || `part of directory ${dir}`;
        log(`loading file (${note}): ${filename}`);
        (0, requireAndWatch_1.requireAndWatch)(graph, filename);
    }
}
function loadFromCurrentDirectory(graph) {
    loadDirectory(graph, ".", "found in cwd");
}
exports.loadFromCurrentDirectory = loadFromCurrentDirectory;
function loadUserSetupJson() {
    if (!process.env.HOME)
        return {};
    const localSetupPath = Path.join(process.env.HOME, ".rqe/local_setup.json");
    if (Fs.existsSync(localSetupPath)) {
        return JSON.parse(Fs.readFileSync(localSetupPath, 'utf8'));
    }
    return {};
}
function loadFromUserSetupDirectories(graph) {
    const data = loadUserSetupJson();
    const dirs = data.load_directories || [];
    for (const dir of dirs) {
        loadDirectory(graph, dir);
    }
}
exports.loadFromUserSetupDirectories = loadFromUserSetupDirectories;
//# sourceMappingURL=loadNearbyModules.js.map