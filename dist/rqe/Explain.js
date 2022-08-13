"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainWhyQueryFails = void 0;
function explainWhyQueryFails(tuple, table) {
    const missingRequired = [];
    const missingRequiredValue = [];
    const extraAttrs = [];
    for (const tag of tuple.tags) {
        if (!table.has(tag.attr)) {
            extraAttrs.push(tag.attr);
        }
    }
    for (const [attr, attrConfig] of Object.entries(table.attrs)) {
        if (attrConfig.required && !tuple.has(attr)) {
            missingRequired.push(attr);
            continue;
        }
    }
    return { missingRequired, missingRequiredValue, extraAttrs };
}
exports.explainWhyQueryFails = explainWhyQueryFails;
//# sourceMappingURL=Explain.js.map