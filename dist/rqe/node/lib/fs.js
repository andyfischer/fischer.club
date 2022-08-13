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
const Fs = __importStar(require("fs/promises"));
const Path = __importStar(require("path"));
const glob_1 = require("glob");
const globalGraph_1 = require("../../globalGraph");
(0, globalGraph_1.func)('[v2] fs $filename $encoding? -> contents buffer', async function (filename, encoding, task) {
    let out = {};
    if (task.has('buffer'))
        out['buffer'] = await Fs.readFile(filename);
    if (task.has('contents')) {
        encoding = encoding || 'utf8';
        out['contents'] = await Fs.readFile(filename, encoding);
    }
    return out;
});
(0, globalGraph_1.func)('[v2] fs put! $filename $contents $encoding?', async (filename, contents, encoding) => {
    encoding = encoding || 'utf8';
    const dir = Path.dirname(filename);
    await Fs.mkdir(dir, { recursive: true });
    await Fs.writeFile(filename, contents, encoding);
    return { filename };
});
(0, globalGraph_1.func)('[v2] fs put! $filename $buffer', async (filename, buffer) => {
    const dir = Path.dirname(filename);
    await Fs.mkdir(dir, { recursive: true });
    await Fs.writeFile(filename, buffer);
    return { filename };
});
(0, globalGraph_1.func)('[v2] fs chmod! $filename $permissions', async (filename, permissions) => {
    await Fs.chmod(filename, permissions);
});
(0, globalGraph_1.func)('[v2] fs delete! $filename if-exists?', async (filename, task) => {
    try {
        await Fs.unlink(filename);
    }
    catch (e) {
        if (e.code === "ENOENT" && task.has('if-exists'))
            return;
        throw e;
    }
});
(0, globalGraph_1.func)('[v2] fs copy! $from_filename $to_filename mkdirp?', async (from_filename, to_filename, task) => {
    if (task.has('mkdirp')) {
        const dir = Path.dirname(to_filename);
        await Fs.mkdir(dir, { recursive: true });
    }
    if (from_filename === to_filename)
        throw new Error("from_filename should not equal to_filename");
    const contents = await Fs.readFile(from_filename);
    await Fs.writeFile(to_filename, contents);
});
(0, globalGraph_1.func)('[v2] fs $from_filename $to_filename -> contents_equal', async (from_filename, to_filename) => {
    try {
        const fromContents = await Fs.readFile(from_filename);
        const toContents = await Fs.readFile(to_filename);
        return { contents_equal: fromContents.equals(toContents) };
    }
    catch (e) {
        return { contents_equal: false };
    }
});
(0, globalGraph_1.func)('[v2] fs mkdirp! $dir', async (dir) => {
    await Fs.mkdir(dir, { recursive: true });
});
(0, globalGraph_1.func)('fs rmrf!: dir ->', async (dir) => {
    await Fs.rmdir(dir, { recursive: true });
});
(0, globalGraph_1.func)('[v2] fs filename -> is_directory', async (filename) => {
    const stat = await Fs.lstat(filename);
    return { is_directory: stat.isDirectory() };
});
(0, globalGraph_1.func)('fs: dir -> contents filename relative_path absolute_path', async (dir) => {
    const contents = await Fs.readdir(dir);
    const out = [];
    for (const relative_path of contents) {
        out.push({
            relative_path,
            absolute_path: Path.resolve(dir, relative_path),
            filename: Path.join(dir, relative_path),
        });
    }
    return out;
});
(0, globalGraph_1.func)('[v2] fs $glob $root_dir? -> filename', async (glob, root_dir, task) => {
    root_dir = root_dir || '.';
    task.streaming();
    (0, glob_1.Glob)(glob, { cwd: root_dir }, async (err, files) => {
        if (err) {
            task.putError(err);
            task.done();
            return;
        }
        for (const filename of files) {
            const fullPath = Path.join(root_dir, filename);
            if (!await task.attr('is_directory', 'fs $filename', { filename: fullPath }))
                task.put({ filename });
        }
        task.done();
    });
});
//# sourceMappingURL=fs.js.map