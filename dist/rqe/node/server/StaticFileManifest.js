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
exports.StaticFileManifest = void 0;
const Crypto = __importStar(require("crypto"));
function filenameExtensionSplit(path) {
    const pos = path.lastIndexOf(".");
    if (pos < 0)
        return [path, ''];
    return [path.slice(0, pos), path.slice(pos + 1)];
}
class StaticFileManifest {
    constructor(graph) {
        this.sourceFiles = [];
        this.cache = new Map();
        this.graph = graph;
    }
    add(source) {
        this.sourceFiles.push(source);
    }
    async getOneFile(source) {
        const buffer = (await this.graph.query(source.fetch)).one().get('contents');
        console.log('got buffer: ', buffer);
        const hash = Crypto.createHash('sha256');
        const [beforeExtension, extension] = filenameExtensionSplit(source.shortFilename);
        hash.update(buffer);
        const hashStr = hash.digest('hex').substring(0, 16);
        let hashedFilename = beforeExtension + "." + hashStr;
        if (extension)
            hashedFilename += '.' + extension;
        if (this.cache.has(hashedFilename))
            return this.cache.get(hashedFilename);
        console.log(`loaded new file: ${source.shortFilename} (${hashStr})`);
        const file = {
            shortFilename: source.shortFilename,
            hashedFilename,
            buffer,
            hash: hashStr,
        };
        this.cache.set(hashedFilename, file);
        return file;
    }
    async getManifest() {
        const result = {
            files: {}
        };
        await Promise.all(this.sourceFiles.map(async (sourceFile) => {
            const file = await this.getOneFile(sourceFile);
            result.files[file.shortFilename] = {
                shortFilename: file.shortFilename,
                hashedFilename: file.hashedFilename,
                hash: file.hash,
            };
        }));
        return result;
    }
}
exports.StaticFileManifest = StaticFileManifest;
//# sourceMappingURL=StaticFileManifest.js.map