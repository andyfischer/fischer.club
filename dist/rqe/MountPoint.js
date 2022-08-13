"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLooseMountPointSpec = exports.pointSpecToDeclString = exports.mountAttrToString = exports.mountSpecPlusAttr = exports.MountPoint = void 0;
const parseTableDecl_1 = require("./parser/parseTableDecl");
class MountPoint {
    constructor(graph, spec, module) {
        this.addedAttributeTables = new Map();
        spec.t = 'mountPointSpec';
        this.spec = spec;
        this.name = spec.name;
        this.module = module;
        this.callback = spec.run;
        this.providerId = spec.providerId;
        this.localId = spec.localId;
        this.attrs = spec.attrs;
        this.requiredAttrCount = 0;
        for (const attrConfig of Object.values(this.attrs))
            if (attrConfig.required)
                this.requiredAttrCount++;
    }
    getRef() {
        if (!this.localId)
            throw new Error("can't getRef, this MountPoint has no localId");
        return { pointId: this.localId, moduleId: this.module.moduleId };
    }
    has(attr) {
        return this.attrs[attr] !== undefined;
    }
    getAddedAttribute(attr) {
        return this.addedAttributeTables.get(attr);
    }
    put() {
        return this.getAddedAttribute('put');
    }
    delete() {
        return this.getAddedAttribute('delete');
    }
    toDeclString() {
        return pointSpecToDeclString(this.spec);
    }
}
exports.MountPoint = MountPoint;
function mountSpecPlusAttr(spec, addedAttr) {
    return {
        name: spec.name + '/' + addedAttr,
        attrs: {
            ...spec.attrs,
            [addedAttr]: { required: true },
        }
    };
}
exports.mountSpecPlusAttr = mountSpecPlusAttr;
function mountAttrToString(attr, details) {
    let out = attr;
    if (!details.required && !details.requiresValue)
        out += '?';
    if (details.requiresValue)
        out += '=x';
    return out;
}
exports.mountAttrToString = mountAttrToString;
function pointSpecToDeclString(spec) {
    const out = [];
    for (const [attr, details] of Object.entries(spec.attrs)) {
        out.push(mountAttrToString(attr, details));
    }
    return out.join(' ');
}
exports.pointSpecToDeclString = pointSpecToDeclString;
function resolveLooseMountPointSpec(looseSpec) {
    if (typeof looseSpec === 'string') {
        const parsed = (0, parseTableDecl_1.parseTableDecl)(looseSpec);
        return parsed;
    }
    return looseSpec;
}
exports.resolveLooseMountPointSpec = resolveLooseMountPointSpec;
//# sourceMappingURL=MountPoint.js.map