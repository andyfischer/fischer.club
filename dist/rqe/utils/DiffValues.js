"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffValues = void 0;
const FailureTracking_1 = require("../FailureTracking");
function getValueType(value) {
    switch (typeof value) {
        case 'boolean':
            return 'boolean';
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'undefined':
            return 'undefined';
    }
    if (Array.isArray(value))
        return 'array';
    if (value === null)
        return 'null';
    return 'object';
}
function diffValues(value, other) {
    if (value === other) {
        return { equal: true };
    }
    const valueType = getValueType(value);
    const otherType = getValueType(other);
    if (valueType !== otherType) {
        return {
            equal: false,
            description: `values have different type: ${valueType} != ${otherType}`,
        };
    }
    if (valueType === 'null' || valueType === 'undefined') {
        return { equal: true };
    }
    if (valueType === 'string') {
        if (value !== other) {
            return {
                equal: false,
                description: `string values are not the same: "${value}" != "${other}"`,
            };
        }
        return { equal: true, };
    }
    if (valueType === 'boolean') {
        if (value !== other) {
            return {
                equal: false,
                description: `boolean values are not the same: "${value}" != "${other}"`,
            };
        }
        return { equal: true, };
    }
    if (valueType === 'number') {
        if (value === NaN && other === NaN)
            return { equal: true };
        if (value !== other) {
            return {
                equal: false,
                description: `number values are not the same: ${value} != ${other}`,
            };
        }
        return { equal: true };
    }
    if (valueType === 'array') {
        if (value.length !== other.length) {
            return {
                equal: false,
                description: `array values have different length: ${value.length} != ${other.length}`,
            };
        }
        for (let i = 0; i < value.length; i++) {
            const elementDiff = diffValues(value[i], other[i]);
            if (!elementDiff.equal) {
                return {
                    equal: false,
                    path: [i].concat(elementDiff.path || []),
                    description: elementDiff.description,
                };
            }
        }
        return { equal: true, };
    }
    if (valueType === 'object') {
        for (const [key, entryValue] of Object.entries(value)) {
            if (value[key] === undefined)
                continue;
            if (other[key] === undefined) {
                return {
                    equal: false,
                    description: `rhs object does not have key '${key}': ${JSON.stringify(other)}`,
                };
            }
            const elementDiff = diffValues(value[key], other[key]);
            if (!elementDiff.equal) {
                return {
                    equal: false,
                    path: [key].concat(elementDiff.path || []),
                    description: elementDiff.description,
                };
            }
        }
        return { equal: true };
    }
    (0, FailureTracking_1.recordFailure)('diff_values_fallthrough', { valueType });
}
exports.diffValues = diffValues;
//# sourceMappingURL=DiffValues.js.map