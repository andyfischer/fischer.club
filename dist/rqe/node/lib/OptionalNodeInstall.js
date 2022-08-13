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
exports.findRootDir = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const globalGraph_1 = require("../../globalGraph");
require("./shell");
async function findRootDir(searchDir) {
    const contents = await fs.readdir(searchDir);
    for (const file of contents) {
        if (file === "package.json")
            return searchDir;
    }
    const parent = path.dirname(searchDir);
    if (parent === searchDir)
        return null;
    if (parent === '/')
        return null;
    return findRootDir(parent);
}
exports.findRootDir = findRootDir;
async function exists(filename) {
    return fs.access(filename).then(() => true).catch(() => false);
}
async function getOptionalNodeDependency(step, name, version) {
    const rootDir = await findRootDir(process.cwd());
    const inNodeModules = path.join(rootDir, 'node_modules', name);
    if (await exists(inNodeModules)) {
        return require(inNodeModules);
    }
    const optionalDir = path.join(rootDir, '.optional');
    const inOptional = path.join(optionalDir, 'node_modules', name);
    if (await exists(inOptional)) {
        return require(inOptional);
    }
    if (!await exists(optionalDir)) {
        await fs.mkdir(optionalDir);
    }
    if (!await exists(path.join(optionalDir, "package.json"))) {
        await fs.writeFile(path.join(optionalDir, "package.json"), "{}");
    }
    console.log('installing optional dependency: ' + name);
    let installCmd = 'yarn add ' + name;
    if (version)
        installCmd += '@' + version;
    const result = await step.query('shell $cmd $cwd stdout stderr', { cmd: installCmd, cwd: optionalDir });
    return require(inOptional);
}
(0, globalGraph_1.func)('node get_optional_dependency: name -> version package', async (name, version, task) => {
    const _package = await getOptionalNodeDependency(task, name, version);
    return { 'package': _package };
});
(0, globalGraph_1.func)('node clear_optional_dependencies!', async (task) => {
    const rootDir = await findRootDir(process.cwd());
    const optionalDir = path.join(rootDir, '.optional');
    await task.query('fs rmrf! $dir', { dir: optionalDir });
});
async function main() {
    console.log('keccak256', (await (0, globalGraph_1.query)('node get_optional_dependency name=keccak256 package')).columnList('package'));
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=OptionalNodeInstall.js.map