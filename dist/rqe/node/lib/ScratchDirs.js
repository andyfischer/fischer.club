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
const globalGraph_1 = require("../../globalGraph");
const path = __importStar(require("path"));
require("./fs");
const OptionalNodeInstall_1 = require("./OptionalNodeInstall");
(0, globalGraph_1.func)('scratch_dir create! -> dir', async function (scratch_dir, task) {
    const scratchRoot = path.join(await (0, OptionalNodeInstall_1.findRootDir)(process.cwd()), '.scratch');
    const dir = path.join(scratchRoot, scratch_dir);
    await task.query('fs mkdirp! $dir', { dir: scratchRoot });
    await task.query('fs mkdirp! $dir', { dir: dir });
    return { dir };
});
//# sourceMappingURL=ScratchDirs.js.map