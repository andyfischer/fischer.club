"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapValues = void 0;
function mapValues(obj, callback) {
    let out = {};
    for (let [k, v] of Object.entries(obj)) {
        v = callback(v, k);
        out[k] = v;
    }
    return out;
}
exports.mapValues = mapValues;
//# sourceMappingURL=mapObject.js.map