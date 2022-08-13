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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexStringToIterator = exports.tokenizeString = exports.LexedText = exports.TokenIterator = void 0;
__exportStar(require("./tokens"), exports);
var TokenIterator_1 = require("./TokenIterator");
Object.defineProperty(exports, "TokenIterator", { enumerable: true, get: function () { return TokenIterator_1.TokenIterator; } });
var LexedText_1 = require("./LexedText");
Object.defineProperty(exports, "LexedText", { enumerable: true, get: function () { return __importDefault(LexedText_1).default; } });
var tokenizeString_1 = require("./tokenizeString");
Object.defineProperty(exports, "tokenizeString", { enumerable: true, get: function () { return tokenizeString_1.tokenizeString; } });
Object.defineProperty(exports, "lexStringToIterator", { enumerable: true, get: function () { return tokenizeString_1.lexStringToIterator; } });
//# sourceMappingURL=index.js.map