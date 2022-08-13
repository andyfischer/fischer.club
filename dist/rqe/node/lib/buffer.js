"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globalGraph_1 = require("../../globalGraph");
(0, globalGraph_1.func)('base64 -> hex', (base64) => {
    const buffer = Buffer.from(base64, 'base64');
    return { hex: buffer.toString('hex') };
});
//# sourceMappingURL=buffer.js.map